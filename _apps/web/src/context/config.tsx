import { JSX, createSignal } from "solid-js"
import { ApiConfig } from "@/types"
import { trpc } from "@/trpc"
import { createStore } from "solid-js/store"

export const [config, setConfig] = createStore<ApiConfig>({
	currency: "EUR",
	vatPercentage: 25,
	funStats: {
		rootServers: 0,
		clients: 0,
		virtualServers: 0,
	},
	paymentProviders: [],
	liveChatScriptSrc: "",
	vncProxyHost: "",
})

export const ConfigProvider = (props: { children: JSX.Element | JSX.Element[] }) => {
	trpc.config.config.useQuery(undefined, {
		onSuccess: (data) => {
			setConfig(data)
		},
		refetchInterval: -1,
		refetchIntervalInBackground: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false
	})

	return (
		<div>
			{props.children}
		</div>
	)
}