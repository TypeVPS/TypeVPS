import {
	GeneralOutput,
	PaymentProvider,
} from ".."

const isEnabled = false
const supportsSubscriptions = false
const createPayment = async (): Promise<GeneralOutput> => {
	await new Promise((resolve) => setTimeout(resolve, 1000))
	throw new Error("Not implemented")
}

export default {
	payment: {
		create: createPayment,
	},
	isEnabled,
	supportsSubscriptions,
	type: "crypto",
} as PaymentProvider
