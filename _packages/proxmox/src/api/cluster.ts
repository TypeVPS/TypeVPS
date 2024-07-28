import { string, z } from "zod";
import { engine } from "../proxmoxApi";
import { zodGet } from "./base";

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
	...args: any
) => Promise<infer R>
	? R
	: any;

const clusterBaseResource = z.object({
	type: z.enum(["storage", "node", "qemu", "pool"]),
	template: z.number().optional(),
	lock: z.string().optional(),
	status: z.string().optional(),
	vmid: z.number().optional(),
});

const clusterQemuResource = clusterBaseResource.merge(
	z.object({
		type: z.literal("qemu"),
		id: z.string(),
		vmid: z.number(),
		diskread: z.number(),
		diskwrite: z.number(),
		maxmem: z.number(),
		node: z.string(),
		cpu: z.number(),
		mem: z.number(),
		uptime: z.number(),
		netin: z.number(),
		disk: z.number(),
		maxcpu: z.number(),
		netout: z.number(),
		maxdisk: z.number(),
		status: z.string(),
		name: z.string(),
	}),
);

const getTasks = async () => {
	const results = await zodGet(
		"cluster/tasks",
		z.object({
			data: z.array(
				z.object({
					id: z.string().optional(),
					node: z.string().optional(),
					pid: z.number().optional(),
					pstart: z.number().optional(),
					status: z.string().optional(),
					type: z.string().optional(),
					upid: z.string().optional(),
					user: z.string().optional(),
					endtime: z.number().optional(),
				}),
			),
		}),
	);

	return results.data;
};
export type ProxmoxTask = AsyncReturnType<typeof getTasks>[0];

const getResources = async () => {
	const resources = await engine.get("/cluster/resources");
	z.object({
		data: z.array(clusterBaseResource),
	}).parse(resources?.data);


	// @eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	return resources.data.data as z.infer<typeof clusterBaseResource>[];
};

const getStorage = async () => {
	const schema = z.object({
		data: z.array(
			z.object({
				priority: z.number(),
				digest: z.string(),
				path: z.string(),
				content: z.string(),
				storage: z.string(),
				"prune-backups": z.string(),
				type: z.string()
			})
		)
	})

	const storage = await zodGet('/storage', schema)

	return storage.data
}

const getTaskLogs = async (taskId: string, node: string) => {
	const schema = z.object({
		total: z.number(),
		data: z.array(
			z.object({ t: z.string(), n: z.number() })
		)
	})

	const logs = await zodGet(`/nodes/${node}/tasks/${taskId}/log`, schema)

	return logs.data
}

const getTaskStatus = async (taskId: string, node: string) => {
	const schema = z.object({
		data: z.object({
			status: z.string()
		}),
	})

	const status = await zodGet(`/nodes/${node}/tasks/${taskId}/status`, schema)
	return status.data
}

const getQemuResources = async () => {
	const resources = await getResources();

	/* for (const resource of resources) {
		//@ts-ignore
		if (resource.type !== "qemu") continue;
		if (resource.template) continue;
		//@ts-ignore
		if (resource.status !== "stopped" && resource.status !== "running") {
			console.log(
				`Resource ${JSON.stringify(resource)} ${
					//@ts-ignore
					resource.status
				} is not running or stopped, skipping`,
			);
		}
	}
 */
	return z.array(clusterQemuResource).parse(
		resources.filter((resource) => {
			if (resource.type !== "qemu") return false;
			if (resource.template) return false;

			if (resource.status === "unknown") return false;

			return true;
		}),
	);
};

export default {
	getTasks,
	getResources,
	getQemuResources,
	getStorage,
	getTaskLogs,
	getTaskStatus,
};
