import { prismaClient } from "./db";
import { ENV } from "./env";
import { pullTasks, pullUserVirtualMachines, pullVMStates } from "./proxmox";
import { redisClient } from "./redis";
import { proxmoxApi } from "@typevps/proxmox";
// get redis stats
const start = async () => {
	await prismaClient.$connect()
	await proxmoxApi.login();

	/* 	await proxmoxApi.qemu.powerAction(
		{
			node: "home",
			vmid: 101,
		},
		"shutdown",
	); */

	await pullUserVirtualMachines()

	const smartInterval = (fn: () => Promise<void>, time: number) => {
		fn().catch((e) => {
			console.error(e);
		});
		setInterval(() => {
			fn().catch((e) => {
				console.error(e);
			});
		}, time);
	};

	smartInterval(pullUserVirtualMachines, 15_000)
	smartInterval(pullVMStates, 1_000)
	smartInterval(pullTasks, 1_000)
};

start().catch((e) => {
	console.error(e);
	process.exit(1);
})