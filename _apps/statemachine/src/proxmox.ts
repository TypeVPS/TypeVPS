import { proxmoxApi } from "@typevps/proxmox";
import { redisClient } from "./redis";
import { TaskChange, VMPowerStateChange, VMState } from "@typevps/shared";
import { UserVirtualMachine } from "@typevps/db";
import { prismaClient } from "./db";

const oldStates: { [key: string]: VMState } = {};
const oldTasks: { [key: string]: string } = {};
const networkUsage: {
	[key: string]: {
		totalNetInBytes: number;
		totalNetOutBytes: number;

		lastNetInBytes: number;
		lastNetOutBytes: number;
	}
} = {};

const liveUpdateVms: Set<string> = new Set();
const userVirtualMachines: Map<string, UserVirtualMachine> = new Map();

export const pullVMStates = async () => {
	const qemuResources = await proxmoxApi.cluster.getQemuResources();
	for (const resource of qemuResources) {
		const _name = resource.name.split("-");
		if (_name.length !== 3) continue;
		const [userName, userId, vmId] = _name;

		// find user virutal machine, so we can get max bandwidth etc.
		const userVmConfig = userVirtualMachines.get(vmId);
		let netUsage = networkUsage[vmId];

		if (!userVmConfig) {
			continue;
		}

		const oldState = oldStates[vmId];
		const state: VMState = {
			status: resource.status === "running" ? "running" : "stopped",
			cpuUsagePercent: resource.cpu * 100,
			memoryMaxBytes: resource.maxmem,
			memoryUsageBytes: resource.mem,
			upTimeSeconds: resource.uptime,
			node: resource.node,
			vmid: resource.vmid,
			bandwidthMaxBytes: Number(userVmConfig?.networkBandwidthBytes) ?? 0,
			bandwidthInBytes: netUsage?.totalNetInBytes ?? 0,
			bandwidthOutBytes: netUsage?.totalNetOutBytes ?? 0,
		};


		if (liveUpdateVms.has(vmId)) {
			const fastState = await proxmoxApi.qemu.getCurrentStatus({
				node: resource.node,
				vmid: resource.vmid,
			});

			state.cpuUsagePercent = fastState.cpu * 100;
			state.memoryUsageBytes = fastState.mem;
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		await redisClient.json.set(`vm:${vmId}:state`, ".", state);
		await redisClient.expire(`vm:${vmId}:state`, 10);

		//console.log(`VM ${vmId} state: ${JSON.stringify(state)}`)

		if (oldState?.status !== state?.status) {
			console.log(`VM ${vmId} state: ${oldState?.status ?? "unknown"} -> ${state.status}`);
			await redisClient.publish(
				"proxmox:vmPowerStateChange",
				JSON.stringify({
					vmId,
					oldPowerState: oldState?.status ?? "unknown",
					newPowerState: state.status,
				} as VMPowerStateChange),
			);
		}

		// count network usage
		if (!netUsage) {
			netUsage = {
				totalNetInBytes: 0,
				totalNetOutBytes: 0,
				lastNetInBytes: resource.netin,
				lastNetOutBytes: resource.netout,
			};
		}

		const netInBytes = resource.netin - netUsage.lastNetInBytes;
		const netOutBytes = resource.netout - netUsage.lastNetOutBytes;

		if (netInBytes >= 0 && netOutBytes >= 0) {
			netUsage.totalNetInBytes += netInBytes;
			netUsage.totalNetOutBytes += netOutBytes;
		}

		netUsage.lastNetInBytes = resource.netin;
		netUsage.lastNetOutBytes = resource.netout;

		if (netUsage.totalNetInBytes > 0 || netUsage.totalNetOutBytes > 0) {
			console.log(`VM ${vmId} net usage: ${netUsage.totalNetInBytes} in, ${netUsage.totalNetOutBytes} out`);
		}

		oldStates[vmId] = state;
	}
};

export const pullTasks = async () => {
	const tasks = await proxmoxApi.cluster.getTasks();
	for (const task of tasks) {
		const id = task.upid;
		if (!id) continue;
		if (!task.status) continue;

		const oldTask = oldTasks[id];

		if (oldTask !== task.status) {
			await redisClient.publish(
				"proxmox:taskChange",
				JSON.stringify({
					newStatus: task.status,
					oldStatus: oldTask,
					taskId: id,
				} as TaskChange),
			);
		}

		oldTasks[id] = task.status;
	}
};

export const pullUserVirtualMachines = async () => {
	const vms = await prismaClient.userVirtualMachine.findMany({
		where: {
			UserPaidService: {
				expiresAt: {
					gte: new Date(),
				},
			}
		}
	})

	userVirtualMachines.clear()
	liveUpdateVms.clear()

	for (const vm of vms) {
		userVirtualMachines.set(vm.id, vm);

		const TIME_FRAME = 2 * 60_000
		if (vm.lastAccessedAt && vm.lastAccessedAt.getTime() > Date.now() - TIME_FRAME) {
			liveUpdateVms.add(vm.id)
		}
	}
}

/* export const pullGuestAgentInfo = async () => {
	const qemuResources = await proxmoxApi.cluster.getQemuResources();
	for (const resource of qemuResources) {
		const _name = resource.name.split("-");
		if (_name.length !== 3) continue;
		const [userName, userId, vmId] = _name;


	}
} */