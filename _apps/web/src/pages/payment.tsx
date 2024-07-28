import { useParams } from "@solidjs/router"
import { z } from "zod"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseParamsZod<T extends z.ZodType<any, any>>(schema: T) {
	const params = useParams()
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return schema.parse(params) as z.infer<T>
}

export const PaymentSubscriptionPage = () => {
	const params = parseParamsZod(
		z.object({
			id: z.string(),
			type: z.enum(["subscription", "payment"]),
		}),
	)

	return (
		<>
		hello {params.id}
		</>
	)
}
