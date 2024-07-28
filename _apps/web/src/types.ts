import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter as SrvAppRouter_ } from "@typevps/api/src/router/tt";
export type SrvAppRouter = SrvAppRouter_;

//export type AppRouterInputs = inferRouterInputs<SrvAppRouter>;
export type AppRouterOutputs = inferRouterOutputs<SrvAppRouter>;

export type ApiVirtualMachine = AppRouterOutputs["vms"]["list"][number];
export type ApiVirtualMachineS = ApiVirtualMachine & {
	// force state to not be null
	state: NonNullable<ApiVirtualMachine["state"]>;
};

export type ApiVirtualMachineState = ApiVirtualMachine["state"];

export type ApiVirtualMachineAgentUser =
	AppRouterOutputs["vms"]["agent"]["users"][0];

/* export type PubSSHKey = AppRouterOutputs['vms']['sshKeys'][0] */
export type ApiVmGraph = AppRouterOutputs["vms"]["graph"][number];
export type ApiProduct = AppRouterOutputs["products"]['list'][number]

export type ApiProductType = ApiProduct["type"];
export const ApiProductType = ["VPS", "GAME_SERVER"] as const;
export type ApiUser = AppRouterOutputs["users"]["list"][number];

export type ApiSubscription = AppRouterOutputs["subscriptions"]["list"][number];
export type ApiPayment = AppRouterOutputs["payments"]["list"][number];

export type ApiTemplate = AppRouterOutputs["vmInstall"]["listTemplates"][number];
export type ApiSetupLog = AppRouterOutputs["vmInstall"]["liveLogs"];
export type ApiSetupLogMessage = ApiSetupLog['messages'][number];
export type ApiIpConfig = AppRouterOutputs["ips"]["list"][number];

export const ApiProductCurrency = [
	"USD",
	"EUR",
	"DKK",
	"NOK",
	"SEK",
	"GDP",
] as const;
export type ApiProductCurrency = typeof ApiProductCurrency[number];
export type ApiIp = AppRouterOutputs["ips"]["list"][0];

export type ApiConfig = AppRouterOutputs["config"]['config'];