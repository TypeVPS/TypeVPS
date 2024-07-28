import { PaymentProviderType } from "@typevps/db"
import { TypedEventEmitter } from "../eventEmitter"

export const paymentEventEmitter = new TypedEventEmitter<{
	"payment:updated": [
		{
			paymentId: string
			paymentProviderId: string
			paymentProvider: PaymentProviderType
		},
	]
	"subscription:updated": [
		{
			subscriptionId: string
			paymentProviderSubscriptionId: string | null
			paymentProvider: PaymentProviderType
		},
	]
}>()
