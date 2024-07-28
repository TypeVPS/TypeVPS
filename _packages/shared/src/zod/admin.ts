import { z } from "zod";
export const createProduct = z.object({
	name: z.string(),
	monthlyPrice: z.number(),
	type: z.enum(["VPS"]),
	networkBandwidthBytes: z.number(),
	networkBandwidthDedicatedMegabit: z.number(),
	networkBandwidthBurstMegabit: z.number(),
	diskBytes: z.number(),
	ramBytes: z.number(),
	cpuCores: z.number(),
	isUserSpecialOffer: z.boolean(),
});
export type CreateProductInput = z.infer<typeof createProduct>;

export const editProduct = createProduct.extend({
	id: z.string(),
});
export type EditProductInput = z.infer<typeof editProduct>;

export const disableEnableProduct = z.object({
	id: z.string(),
	enabled: z.boolean(),
});
export type DisableEnableProductInput = z.infer<typeof disableEnableProduct>;

export const setFeaturedProduct = z.object({
	id: z.string(),
	featured: z.boolean(),
});
export type SetFeaturedProductInput = z.infer<typeof setFeaturedProduct>;

export const setSortOrderProduct = z.object({
	id: z.string(),
	sortOrder: z.number(),
});
export type SetSortIndexProductInput = z.infer<typeof setSortOrderProduct>;

const IPV4_REGEX =
	/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^([0-9a-f]{1,4}:){7,7}[0-9a-f]{1,4}$/;

const ipValidator = z.string().refine(
	(v) => {
		if (v.match(IPV4_REGEX)) {
			return true;
		}
		if (v.match(IPV6_REGEX)) {
			return true;
		}
	},
	{
		message: "Invalid IP address",
	},
);



export const addIp = z.object({
	kind: z.enum(["IPV6", "IPV4"]),
	// validate address if its ipv4 and ipv6
	address: ipValidator,
	subnet: ipValidator,
	gateway: ipValidator,
});
export type AdminAddIpInput = z.infer<typeof addIp>;

export const addIpPrefix = z.object({
	ipKind: z.enum(["IPV6", "IPV4"]),
	// validate address if its ipv4 and ipv6
	ipAddress: ipValidator,
	ipSubnet: ipValidator,
	ipGateway: ipValidator,
});

export const importVm = z.object({
	node: z.string(),
	vmid: z.number(),
	userId: z.number(),
	monthlyPrice: z.number(),
	validForDays: z.number(),
}).merge(addIpPrefix)
export type ImportVmInput = z.infer<typeof importVm>;

export const removeIp = z.object({
	id: ipValidator,
});
export type AdminRemoveIpInput = z.infer<typeof removeIp>;

export const installVm = z.object({
	type: z.enum(["iso", "template"]),
	templateId: z.string().optional(),
	isoId: z.string().optional(),

	id: z.string(),
	username: z.string().optional(),
	password: z.string().optional(),
	sshKeyIds: z.array(z.string()).optional(),
	vncPassword: z.string(),
});
export type InstallVmInput = z.infer<typeof installVm>;

export const createTemplate = z.object({
	name: z.string(),
	qcow2Url: z.string().url(),
	minimumDiskBytes: z.number(),
	minimumRamBytes: z.number(),
	minimumCpuCores: z.number(),
	osType: z.enum(["LINUX", "WINDOWS"]),
});
export type CreateTemplateInput = z.infer<typeof createTemplate>;