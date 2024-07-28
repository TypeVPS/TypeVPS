import { PaymentProviderType } from "@typevps/db"
import { PaymentProvider } from "."
import bitpay from "./providers/bitpay"
import coinbase from "./providers/coinbase"
import stripe from "./providers/stripe"

export const PAYMENT_PROVIDERS: {
	[key in PaymentProviderType]: PaymentProvider
} = {
	BITPAY_SERVER: bitpay,
	COINBASE_COMMERCE: coinbase,
	STRIPE: stripe,
}
