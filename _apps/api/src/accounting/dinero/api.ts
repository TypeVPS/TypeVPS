import { prismaClient } from "@/db";
import axios from "axios";
import { z } from "zod";
import { ENV } from "../../env";
import { AccountingCreateInvoice } from "../base";
import { getAccessToken } from "./auth";

const ACCOUNT_NUMBER = ENV.DINERO_ACCOUNT_NUMBER
const client = axios.create({
    baseURL: 'https://api.dinero.dk/',
})

const updateAccessToken = () => {
    getAccessToken().then(token => {
        client.defaults.headers.Authorization = `Bearer ${token}`
    }).catch(err => {
        console.error('could not refresh access token', err)
    })
}
setInterval(() => updateAccessToken, 1000 * 60 * 1)
updateAccessToken()

// intercept all errors, and log data
client.interceptors.response.use(
    (response) => response,
    (error) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        throw error.response.data
    }
)

export const ORG_ID = '434054'

const createContact = async (name: string, email: string) => {
    const id = await client.post(`/v1/${ORG_ID}/contacts`, {
        "name": name,
        "email": email,
        "isPerson": true,
        "isMember": false,
        "useCvr": false,
        "countryKey": "DK",
    })

    return z.object({
        ContactGuid: z.string()
    }).parse(id.data)
}

const getContactGuid = async (userId: number) => {
    const user = await prismaClient.user.findUnique({
        where: {
            id: userId
        },
        include: {
            DineroUserAccountLink: true
        }
    })

    if (!user) {
        throw new Error('User not found')
    }

    if (user.DineroUserAccountLink) {
        return user.DineroUserAccountLink.dineroUserGuid
    }

    const guid = await createContact(user.fullName, user.email)
    // store guid in db
    await prismaClient.dineroUserAccountLink.create({
        data: {
            userId: user.id,
            dineroUserGuid: guid.ContactGuid
        }
    })

    return guid.ContactGuid
}

export const createInvoice = async (invoice: AccountingCreateInvoice) => {
    const contactGuid = await getContactGuid(invoice.userId)
    const date = invoice.date.toISOString().split('T')[0]

    const apiInvoice = await client.post(`/v1/${ORG_ID}/invoices`, {
        "currency": ENV.CURRENCY,
        "language": "en-GB",
        "externalReference": `serviceId: ${invoice.serviceId}`,
        "description": invoice.description,
        "date": date,
        "productLines": invoice.products.map(product => ({
            "description": product.name,
            "quantity": product.quantity,
            "unit": "parts",
            "lineType": "Product",
            "baseAmountValue": product.price,
            "accountNumber": 1000,
        })),
        "contactGuid": contactGuid,
        'showLinesInclVat': true,
    }, {
        headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            "Content-Type": 'application/json'
        }
    })

    const apiInvoiceSchema = z.object({
        Guid: z.string(),
        TimeStamp: z.string()
    })
    let apiInvoiceData = apiInvoiceSchema.parse(apiInvoice.data)

    // book the invoice
    const bookInvoice = await client.post(`/v1/${ORG_ID}/invoices/${apiInvoiceData.Guid}/book`, {
        "timestamp": apiInvoiceData.TimeStamp,
    })
    apiInvoiceData = apiInvoiceSchema.parse(bookInvoice.data)


    // register payment
    await client.post(`/v1/${ORG_ID}/invoices/${apiInvoiceData.Guid}/payments`, {
        description: `serviceId: ${invoice.serviceId} provider: ${invoice.paymentProvider}`,
        amount: 10,
        depositAccountNumber: ACCOUNT_NUMBER,
        remainderIsFee: true,
        timestamp: apiInvoiceData.TimeStamp,
    })

    // download the invoice
    const pdf = await client.get(`/v1/${ORG_ID}/invoices/${apiInvoiceData.Guid}`, {
        responseType: 'arraybuffer',
        headers: {
            Accept: 'application/octet-stream'
        }
    })

    return {
        pdfStream: pdf.data as Buffer,
    }
}

export const listEntryAccounts = async () => {
    return client.get(`/v1/${ORG_ID}/accounts/entry`)
}