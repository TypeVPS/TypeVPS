/* export interface AccountingCreateUser {
    name: string
    email: string
}

export interface AccountingCreateUserOut {
    id: string
    provider: 'DINERO'
} */

import { PaymentProviderType } from "@typevps/db"

export interface AccountingCreateInvoice {
    userId: number
    serviceId: string
    description: string
    date: Date,
    totalWithFees: number
    totalWithoutFees: number
    paymentProvider: PaymentProviderType

    products: {
        name: string
        price: number
        quantity: number
    }[]
}