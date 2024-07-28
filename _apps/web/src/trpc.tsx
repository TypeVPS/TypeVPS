/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
	QueryClient
} from "@tanstack/solid-query"
import superjson from "superjson"
import {
	CreateTRPCClientOptions,
	createTRPCProxyClient,
	createTRPCSolid,
	httpBatchLink
} from "./TRPC_SOLID"

import { JSX } from "solid-js"
import Notifications from "./components/Notifications"
import type { SrvAppRouter } from "./types"

const opts: CreateTRPCClientOptions<SrvAppRouter> = {
	transformer: superjson,
	links: [
		httpBatchLink({
			url: "/api/trpc",
		}),
	],
}
export const trpc = createTRPCSolid<SrvAppRouter>({})
export const client = trpc.createClient(opts)
export const trpcBase = createTRPCProxyClient<SrvAppRouter>(opts)

export const queryClient = new QueryClient({
	defaultOptions: {
		mutations: {
			onError: (err) => {
				Notifications.notify({
					// @ts-ignore
					message: err?.message as string,
					time: 5000,
					type: "error",
				})
			},
			retry: 0,
		},
		queries: {
			onError: (err) => {
				Notifications.notify({
					// @ts-ignore
					message: err?.message as string,
					time: 5000,
					type: "error",
				})
			},
			retry: 0,
		},
	},
})

export const ApiProvider = (props: {
	children: JSX.Element | JSX.Element[]
}) => {
	return (
		<trpc.Provider client={client} queryClient={queryClient}>
			{props.children}
		</trpc.Provider>
	)
}
