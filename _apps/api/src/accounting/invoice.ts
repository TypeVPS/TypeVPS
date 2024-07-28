import dayjs from "dayjs";
import { getUserPaidServiceDetails } from "../router/payments/service";
import * as dinero from "./dinero/api";
import { AccountingCreateInvoice } from "./base";
import { ENV } from "../env";

export const sendInvoice = async (opts: {
    userPaidServiceId: string;
    duration: {
        amount: number;
        unit: dayjs.ManipulateType
    }
    userId: number;
}) => {
    /* const details = await getUserPaidServiceDetails(opts.userPaidServiceId)
    const invoiceData: AccountingCreateInvoice = {
        date: new Date(),
        description: `Service: ${details.services.map(s => s.description).join(', ')}`,
        products: details.services.map(s => ({
            name: s.description,
            price: 100,
            quantity: opts.duration.amount
        })),
        userId: opts.userId,
        serviceId: opts.userPaidServiceId,
        paymentProvider: 'STRIPE',
        totalWithFees: 100,
        totalWithoutFees: 95,
    }

    if(ENV.DINERO_CLIENT_ID && ENV.DINERO_CLIENT_SECRET) {
        const pdf = await dinero.createInvoice(invoiceData)
    } */




}