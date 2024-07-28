import { router } from ".."
import { authProcedure } from "../auth"

export const isoRouter = router({
	list: authProcedure.query(() => {
		return []
	}),
	create: authProcedure.mutation(() => {
		return ''
	}),
})
