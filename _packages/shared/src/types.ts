export type VMPowerState = "running" | "stopped" | "unknown";
export interface VMState {
	status: VMPowerState;

	cpuUsagePercent: number;
	memoryUsageBytes: number;
	memoryMaxBytes: number;
	upTimeSeconds: number;

	bandwidthInBytes: number;
	bandwidthOutBytes: number;

	bandwidthMaxBytes: number;
	

	node: string;
	vmid: number;
}
export type PubVMState = VMState;

export interface VMPowerStateChange {
	vmId: string;
	oldPowerState: VMState["status"];
	newPowerState: VMState["status"];
}

export interface TaskChange {
	taskId: string;
	newStatus: string;
	oldStatus: string;
}
