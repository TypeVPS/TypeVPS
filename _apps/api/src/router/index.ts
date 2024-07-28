import { initTRPC } from "@trpc/server"
import superjson from "superjson"
import type { Context } from "@/context"
import { redisClient } from "../redis"

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape }) {
		return shape
	},

})

export const router = t.router
export const procedure = t.procedure
export const middleware = t.middleware

