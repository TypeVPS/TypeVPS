import {
	TaskChange,
	VMPowerState,
	VMPowerStateChange,
	VMState,
} from "@typevps/shared";
import { _redisClient, redisClient } from "./redis";
import { TypedEventEmitter } from "./eventEmitter";
import { ProxmoxIdOBJ, proxmoxApi } from "@typevps/proxmox";
import { LiveLogger } from "./liveLogger";

export const waitForStateRemoved = async (
	dbId: string,
	maxRetries = 0,
	currentRetry = 0,
): Promise<void> => {
	const state = await redisClient.json.get(`vm:${dbId}:state`, {
		path: ".",
	});
	if (state) {
		if (currentRetry >= maxRetries) return;

		await new Promise((r) => setTimeout(r, 6_000));
		return waitForStateRemoved(dbId, maxRetries, currentRetry + 1);
	}
};


export const getVMState = async (
	dbId: string,
	maxRetries = 0,
	currentRetry = 0,
): Promise<VMState | undefined> => {
	const state = await redisClient.json.get(`vm:${dbId}:state`, {
		path: ".",
	});
	if (!state) {
		if (currentRetry >= maxRetries) return undefined;

		await new Promise((r) => setTimeout(r, 6_000));
		return getVMState(dbId, maxRetries, currentRetry + 1);
	}

	return state as unknown as VMState;
};

export const getPubVMState = async (dbId: string) => {
	return getVMState(dbId);
};

export const getVmNodeId = async (dbId: string) => {
	const vmState = await getVMState(dbId);
	if (!vmState) throw new Error("VM not found");

	return {
		node: vmState?.node,
		vmid: vmState?.vmid,
	};
};

interface ProxmoxTaskStatus {
	upid: string;
	oldStatus: string;
	newStatus: string;
}
const proxmoxEmitter = new TypedEventEmitter<{
	"vm:state": [{ vmId: string; state: VMState }];
	"vm:powerStateChange": [{ vmId: string; powerState: VMPowerState }];
	"task:ok": [task: ProxmoxTaskStatus];
	"task:failed": [task: ProxmoxTaskStatus];
	"task:done": [task: ProxmoxTaskStatus];
}>();

const waitForTaskDone = async (taskId: string, timeout = 60_000) => {
	return proxmoxEmitter.onceAwaited("task:done", timeout, (task) => {
		return task.upid === taskId;
	});
};
/* 
const waitForTaskDoneUpdateLiveLogger = async (
	opts: {
		taskId: string,
		node: string,
		prefix: string,
		liveLogger: LiveLogger
	},
	timeout = 60_000,
) => {
	let processed = 0;
	let run = true;

	while (run) {
		const logs = await proxmoxApi.cluster.getTaskLogs(opts.taskId, opts.node);
		const status = await proxmoxApi.cluster.getTaskStatus(opts.taskId, opts.node);

		if(status.status === 'stopped') {
			opts.liveLogger.log(`${opts.prefix}: 100%`);
			run = false;
			break;
		}



		for (const log of logs) {
			if (log.n > processed) {
				processed = log.n;
				// find number infront of percent
				const percent = log.t.match(/(\d+)%/)?.[1];
				if (percent) {
					opts.liveLogger.log(`${opts.prefix}: ${percent}%`);
				}
			}
		}
		break

	}

}
 */
const powerActionWait = async (
	vm: ProxmoxIdOBJ,
	vmDbId: string,
	action: "reboot" | "reset" | "shutdown" | "start" | "stop" | "suspend",
) => {
	const { taskId } = await proxmoxApi.qemu.powerAction(vm, action);
	await Promise.all([
		waitForTaskDone(taskId),
		proxmoxEmitter.onceAwaited("vm:powerStateChange", 120_000, (opts) => {
			return opts.vmId === vmDbId;
		}),
	]);
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
_redisClient.pSubscribe("proxmox:*", (message, channel) => {
	if (!message) return;
	if (!channel) return;

	if (channel === "proxmox:vmPowerStateChange") {
		const data = JSON.parse(message) as VMPowerStateChange;

		proxmoxEmitter.emit("vm:powerStateChange", {
			powerState: data.newPowerState,
			vmId: data.vmId,
		});
	}

	if (channel === "proxmox:taskChange") {
		const data = JSON.parse(message) as TaskChange;

		const emitData: ProxmoxTaskStatus = {
			newStatus: data.newStatus,
			oldStatus: data.oldStatus,
			upid: data.taskId,
		};

		if (data.newStatus === "OK") proxmoxEmitter.emit("task:ok", emitData);
		if (data.newStatus === "FAILED")
			proxmoxEmitter.emit("task:failed", emitData);

		if (["OK", "FAILED"].includes(data.newStatus ?? ""))
			proxmoxEmitter.emit("task:done", emitData);

		//proxmoxEmitter.emit("task:done", data);
	}
});

export const waitForAgentOnline = async (
	vm: ProxmoxIdOBJ,
	timeout = 60_000,
) => {
	// continue ping the agent until it responds
	const start = Date.now();
	while (Date.now() - start < timeout) {
		const ping = await proxmoxApi.agent.ping(vm);
		if (ping) return true;

		await new Promise((r) => setTimeout(r, 1_000));
	}

	return false;
}

export default {
	proxmoxEmitter,
	waitForTaskDone,
	powerActionWait,
	waitForAgentOnline,
};
