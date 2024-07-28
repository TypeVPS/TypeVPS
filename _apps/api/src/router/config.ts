import { PaymentProviderType } from "@typevps/db"
import type { PaymentProviderType as PaymentProviderType_ } from "@typevps/db"
import { procedure, router } from "."
import { ENV } from "../env"
import { PAYMENT_PROVIDERS } from "../payments/providers"

const getPaymentProviders = () => {
	const paymentProviders = []
	for (const paymentProviderName in PaymentProviderType) {
		const name = paymentProviderName as PaymentProviderType_
		const paymentProvider = PAYMENT_PROVIDERS[name]
		if (!paymentProvider) {
			continue
		}

		if (!paymentProvider.isEnabled) {
			continue
		}

		paymentProviders.push({
			name,
			supportsSubscriptions: !!paymentProvider.subscription,
			type: paymentProvider.type,
		})
	}

	return paymentProviders
}

export const configRouter = router({
	config: procedure.query(() => {
		return {
			currency: ENV.CURRENCY,
			vatPercentage: 25,
			paymentProviders: getPaymentProviders(),
			funStats: {
				rootServers: 0,
				virtualServers: 0,
				clients: 0,
			},

			liveChatScriptSrc: '//code.tidio.co/1tybxownoji7fi27fqklwuqfef1xe77h.js',
			vncProxyHost: ENV.NO_VNC_URL,
		}
	}),
})
