import { z } from "zod";
import { ProxmoxIdOBJ, engine } from "../proxmoxApi";
import { qemuZodGet } from "./base";

export default {
	ping: async (vm: ProxmoxIdOBJ) => {
		try {
			const { status } = await engine.post<any>(`/nodes/${vm.node}/qemu/${vm.vmid}/agent/ping`, {}, {
				timeout: 5000,
			});
			if (status === 200) {
				return true
			}

			return false;
		} catch (e) {
			return false;
		}
	},
	getFsInfo: async (vm: ProxmoxIdOBJ) => {
		const results = await qemuZodGet(
			vm,
			"agent/get-fsinfo",
			z.object({
				data: z.object({
					result: z.array(
						z.object({
							"used-bytes": z.number().optional(),
							"total-bytes": z.number().optional(),
							type: z.string(),
							mountpoint: z.string(),
							name: z.string(),
						}),
					),
				}),
			}),
		);

		return results.data.result;
	},
	getHostName: async (vm: ProxmoxIdOBJ) => {
		const results = await qemuZodGet(
			vm,
			"agent/get-host-name",
			z.object({
				data: z.object({
					result: z.object({
						"host-name": z.string(),
					}),
				}),
			}),
		);

		return results.data.result["host-name"];
	},

	getNetworkInterfaces: async (vm: ProxmoxIdOBJ) => {
		const results = await qemuZodGet(
			vm,
			"agent/network-get-interfaces",
			z.object({
				data: z.object({
					result: z.array(
						z.object({
							statistics: z.object({
								"rx-bytes": z.number(),
								"tx-bytes": z.number(),
								"tx-errs": z.number(),
								"rx-packets": z.number(),
								"rx-errs": z.number(),
								"tx-packets": z.number(),
								"rx-dropped": z.number(),
								"tx-dropped": z.number(),
							}),
							"ip-addresses": z.array(
								z.object({
									"ip-address-type": z.string(),
									prefix: z.number(),
									"ip-address": z.string(),
								}),
							),
							"hardware-address": z.string(),
							name: z.string(),
						}),
					),
				}),
			}),
		);

		return results.data.result;
	},

	getOsInfo: async (vm: ProxmoxIdOBJ) => {
		const results = await qemuZodGet(
			vm,
			"agent/get-osinfo",
			z.object({
				data: z.object({
					result: z.object({
						"version-id": z.string(),
						variant: z.string().optional(),
						id: z.string(),
						version: z.string(),
						"variant-id": z.string().optional(),
						machine: z.string(),
						"kernel-release": z.string(),
						"kernel-version": z.string(),
						name: z.string(),
						"pretty-name": z.string(),
					}),
				}),
			}),
		);

		return results.data.result;
	},

	getUsers: async (vm: ProxmoxIdOBJ) => {
		const results = await qemuZodGet(
			vm,
			"agent/get-users",
			z.object({
				data: z.object({
					result: z.array(
						z.object({
							user: z.string(),
							"login-time": z.number(),
						}),
					),
				}),
			}),
		);

		return results.data.result;
	},
	exec: async (vm: ProxmoxIdOBJ, cmd: string, inputData?: string) => {
		const { status, statusText } = await engine.post<any>(`/nodes/${vm.node}/qemu/${vm.vmid}/agent/exec`, {
			command: cmd,
			'input-data': inputData,
		});

		return {
			pid: 69
		};
	},
	execStatus: async (vm: ProxmoxIdOBJ, pid: number) => {
		const results = await qemuZodGet(
			vm,
			"agent/exec-status",
			z.object({
				data: z.object({
					'out-data': z.string(),
					exited: z.number(),
					exitcode: z.number(),
				}),
			}),
			{
				method: "POST",
				params: {
					pid,
				}
			},
		);

		return results.data;
	},
	setPassword: async (vm: ProxmoxIdOBJ, username: string, password: string) => {
		const { status } = await engine.post<any>(`/nodes/${vm.node}/qemu/${vm.vmid}/agent/set-user-password`, {
			username,
			password,
		});

	}
};
