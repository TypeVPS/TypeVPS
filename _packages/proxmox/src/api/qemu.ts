import { z } from "zod";
import { ProxmoxIdOBJ, engine } from "../proxmoxApi";
import { qemuZodGet, zodGet } from "./base";

const getVmInfo = async (vm: ProxmoxIdOBJ) => {
	const results = await qemuZodGet(
		vm,
		"",
		z.object({
			data: z.object({
				name: z.string(),
				vmid: z.number(),
				pid: z.number(),
				status: z.string(),
				uptime: z.number(),

				netout: z.number(),
				netin: z.number(),

				disk: z.number(),
				diskread: z.number(),
				diskwrite: z.number(),
				maxdisk: z.number(),

				cpu: z.number(),
				cpus: z.number(),
				mem: z.number(),
				maxmem: z.number(),
			}),
		}),
	);

	return results.data;
};

const getRDD = async (
	vm: ProxmoxIdOBJ,
	opts: {
		timeframe: "hour" | "day" | "week" | "month" | "year";
		cf: "AVERAGE" | "MAX";
	},
) => {
	const results = await qemuZodGet(
		vm,
		"rrddata",
		z.object({
			data: z.array(
				z.object({
					time: z.number(),
					disk: z.number().optional(),
					diskread: z.number().optional(),
					diskwrite: z.number().optional(),
					maxdisk: z.number().optional(),
					cpu: z.number().optional(),
					maxcpu: z.number().optional(),
					mem: z.number().optional(),
					maxmem: z.number().optional(),
					netin: z.number().optional(),
					maxin: z.number().optional(),
					netout: z.number().optional(),
					maxout: z.number().optional(),
				}),
			),
		}),
		{
			params: {
				cf: opts.cf,
				timeframe: opts.timeframe,
			},
		},
	);

	return results.data;
};

const getVmConfig = async (vm: ProxmoxIdOBJ) => {
	const results = await qemuZodGet(
		vm,
		"config",
		z.object({
			data: z.object({
				description: z.string().optional(),
				vmgendid: z.string().optional(),
				boot: z.string().optional(),
				ostype: z.string().optional(),
				sockets: z.number().optional(),
				scsihw: z.string().optional(),
				name: z.string().optional(),
				meta: z.string().optional(),
				smbios1: z.string().optional(),
				cores: z.number().optional(),
				scsi0: z.string().optional(),
				ide2: z.string().optional(),
				memory: z.number().optional(),
				digest: z.string().optional(),
				numa: z.number().optional(),
				args: z.string().optional(),

				net0: z.string().optional(),
				net1: z.string().optional(),
				net2: z.string().optional(),
				net3: z.string().optional(),
				net4: z.string().optional(),
				net5: z.string().optional(),
				net6: z.string().optional(),
				net7: z.string().optional(),
				net8: z.string().optional(),
				net9: z.string().optional(),
				net10: z.string().optional(),
			}),
		}),
	);

	return results.data;
};

const powerAction = async (
	id: ProxmoxIdOBJ,
	action: "reboot" | "reset" | "shutdown" | "start" | "stop" | "suspend",
) => {
	const results = await qemuZodGet(
		id,
		`/status/${action}`,
		z.object({
			data: z.string(),
		}),
		{
			method: "POST",
		},
	);

	return {
		taskId: results.data,
	};
};

const deleteVm = async (id: ProxmoxIdOBJ) => {
	const results = await qemuZodGet(
		id,
		"",
		z.object({
			data: z.string(),
		}),
		{
			method: "DELETE",
		},
	);

	return {
		taskId: results.data,
	};
};

//
const editVmConfig = async (
	vm: ProxmoxIdOBJ,
	opts: {
		//sshkeys?: string[];
		//cipassword?: string;
		//ciuser?: string;
		cicustom?: string;
		vmName?: string;
		ipconfig?: {
			ipv4: string;
			gateway: string;
		}[];
		net?: {
			bridge: string;
			model: string;
			firewall: boolean;
		}[];
	},
) => {
	const networks: {
		[key: string]: string;
	} = {};
	// this configures the the network
	if (opts.ipconfig) {
		opts.ipconfig.forEach((net, i) => {
			networks[`ipconfig${i}`] = `ip=${net.ipv4},gw=${net.gateway}`;
		});
	}

	// this creates the network cards
	if (opts.net) {
		opts.net.forEach((net, i) => {
			// example: net0: virtio,bridge=vmbr0,firewall=1
			networks[`net${i}`] = `${net.model},bridge=${net.bridge},firewall=${net.firewall ? 1 : 0}`;
		});
	}

	const params = {
		cicustom: opts.cicustom,
		name: opts.vmName,
		...networks,
	};

	await qemuZodGet(vm, "config", z.object({}), {
		method: "PUT",
		params: params,
	});
};

const deleteVarsFromVmConfig = async (vm: ProxmoxIdOBJ, vars: string[]) => {
	await qemuZodGet(vm, "config", z.object({}), {
		method: "PUT",
		params: {
			delete: vars.join(","),
		},
	});
};

const create = async (
	vm: ProxmoxIdOBJ,
	params: {
		cpu?: string; // Cpu type
		scsihw: string; // Specifies the SCSI controller model. e.g., 'lsi'
		name: string; // The name of the VM.
		description: string; // The description of the VM.
		ostype: string; // Operating system type. This is used to setup configuration defaults. Possible values: 'l26', 'other'.
		//ide2: string; // Specifies the CD/DVD drive. e.g., 'local:iso/debian-10.1.0-amd64-netinst.iso,media=cdrom'
		memory: string; // Memory size in MB.
		sockets: number; // The number of CPU sockets.
		cores: number; // The number of cores per socket.
		net0: string; // Specifies the network device. e.g., 'virtio,bridge=vmbr0'
		bootdisk: string; // Enable booting from specified disk.
		onboot: boolean; // Specifies whether a VM will be started during system bootup.
		// scsi1
		scsi0?: string; // Specifies the disk. e.g., 'local-lvm:vm-100-disk-0,size=32G' 
		cicustom: string; // Specifies a cloud-init configuration drive. e.g., 'cloudinit'  
		//ide2: string; // Specifies the CD/DVD drive. e.g., 'local:iso/debian-10.1.0-amd64-netinst.iso,media=cdrom'
		//cloudinit: string; // Specifies a cloud-init configuration drive. e.g., 'cloudinit'
		ide2?: string; // Specifies the CD/DVD drive. e.g., 'local:iso/debian-10.1.0-amd64-netinst.iso,media=cdrom'
		agent: string; // Enable/disable Qemu GuestAgent.
		scihw?: string; // Specifies the SCSI controller model. e.g., 'lsi'
		efidisk0?: string; // Enable UEFI support by passing a disk image. e.g., 'local-lvm:vm-100-disk-1,size=128K'
		virtio0?: string; // Specifies the disk. e.g., 'local-lvm:vm-100-disk-0,size=32G'
		bios?: string; // Select BIOS implementation. e.g., 'seabios'
	}
) => {
	const form = {
		...params,
		vmid: vm.vmid,
	}

	const { data, status, statusText } = await engine.post<{ data: string }>(
		`/nodes/${vm.node}/qemu`,
		form,
	);

	console.log(status, statusText, data);

	if (!data.data || typeof data.data !== "string") {
		throw new Error("Invalid response");
	}

	return {
		taskId: data.data,
	};
};

const expandDisk = async (
	vm: ProxmoxIdOBJ,
	params: {
		disk: string;
		size: string;
	},
) => {
	const form = {
		size: params.size,
		disk: params.disk,
	};

	const { data, status, statusText } = await engine.put<{ data: string }>(
		`/nodes/${vm.node}/qemu/${vm.vmid}/resize`,
		form,
	)
}


const clone = async (
	vm: ProxmoxIdOBJ,
	params: {
		newId: number;
		name: string;
		targetNode: string;
		description: string;
	},
) => {
	const form = {
		newid: params.newId,
		name: params.name,
		target: params.targetNode,
		description: params.description,
	};
	const { data, status, statusText } = await engine.post<{ data: string }>(
		`/nodes/${vm.node}/qemu/${vm.vmid}/clone`,
		form,
	);

	if (!data.data || typeof data.data !== "string") {
		throw new Error("Invalid response");
	}

	return {
		taskId: data.data,
	};
};

const getCurrentStatus = async (vm: ProxmoxIdOBJ) => {
	const data = await qemuZodGet(
		vm,
		"status/current",
		z.object({
			data: z.object({
				cpu: z.number(),
				mem: z.number(),
				agent: z.number().optional(),
			}),
		}),
	);

	return data.data;
};

const firewallCreateIpSet = async (
	vm: ProxmoxIdOBJ,
	opts: {
		name: string;
	},
) => {
	await qemuZodGet(vm, "firewall/ipset", z.object({}), {
		method: "POST",
		params: {
			name: opts.name,
		},
	});
};

const firewallAddIpSet = async (
	vm: ProxmoxIdOBJ,
	opts: {
		ipset: string;
		nomatch: boolean;
		cidr: string;
	},
) => {
	await qemuZodGet(
		vm,
		`firewall/ipset/${opts.ipset}`,
		z.object({}),
		{
			method: "POST",
			params: {
				nomatch: opts.nomatch ? "1" : "0",
				cidr: opts.cidr,
			},
		},
	);
};

const firewallAddRule = async (
	vm: ProxmoxIdOBJ,
	opts: {
		type: "in" | "out";
		action: "ACCEPT" | "DROP" | "REJECT";
		source: string;
		dest: string;
		enable: boolean;
		macro?: string;
		proto?: string;
		sport?: string;
		dport?: string;
		comment?: string;
		log?: "nolog" | "log";
		icmpType?: string;
	},
) => {
	await qemuZodGet(vm, `firewall/rules`, z.object({}), {
		method: "POST",
		params: {
			type: opts.type,
			action: opts.action,
			source: opts.source,
			dest: opts.dest,
			enable: opts.enable ? "1" : "0",
			macro: "",
			proto: "",
			sport: "",
			dport: "",
			comment: "",
			log: "nolog",
			"icmp-type": "",
		},
	});
};

const editFirewallConfig = async (
	vm: ProxmoxIdOBJ,
	opts: {
		policy_in: "ACCEPT" | "DROP" | "REJECT";
		policy_out: "ACCEPT" | "DROP" | "REJECT";
		enable: boolean;
	},
) => {
	await qemuZodGet(vm, `firewall/options`, z.object({}), {
		method: "PUT",
		params: {
			policy_in: opts.policy_in,
			policy_out: opts.policy_out,
			enable: opts.enable ? "1" : "0",
		},
	});
};

export default {
	getVmInfo,
	getRDD,
	getVmConfig,
	powerAction,
	delete: deleteVm,
	editVmConfig,
	clone,
	getCurrentStatus,
	firewallCreateIpSet,
	firewallAddIpSet,
	editFirewallConfig,
	firewallAddRule,
	deleteVarsFromVmConfig,
	create,
	expandDisk,
};
