import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify"
import { inferAsyncReturnType } from "@trpc/server"
import { UserRole } from "@typevps/db"
import { PubJwtData } from "./router/auth"

export function createContext({ req, res }: CreateFastifyContextOptions) {
	return { req, res, getIpAddress: () => {
		// get primary ip address
		const ip = req.headers["x-forwarded-for"] as string | undefined
		if (ip) {
			return ip
		}

		return req.socket.remoteAddress ?? "unknown"
	} }
}

export type Context = inferAsyncReturnType<typeof createContext>
export type AuthContext = Context & {
	user: PubJwtData
	ensureRole: (role: UserRole) => void
}
