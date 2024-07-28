import { AuthContext } from "@/context";
import { prismaClient } from "@/db";
import { getPubVMState } from "@/proxmox";
import { TRPCError } from "@trpc/server";
import { ProxmoxInstallStatus, User, UserVirtualMachine } from "@typevps/db";
import { PubVMState } from "@typevps/shared";
import { PubJwtData } from "../auth";

// a function that floors with decimal precision
export const floor = (num: number, precision = 2) => {
	const factor = 10 ** precision;
	return Math.floor(num * factor) / factor;
};

interface PubUserPaidService {
	expiresAt: Date | null;
	isExpired: boolean;
	id: string;
	autoRenews?: boolean;
}

interface PubVirtualMachine {
	id: string;
	state?: PubVMState;
	guestToolsRunning: boolean;
	guestInfo?: {
		hostName?: string;
		os: string;
		osVersion: string;
	};
	product: {
		name: string;
		installStatus: ProxmoxInstallStatus;
		cpuCores: number;
		ramBytes: bigint;
		diskBytes: bigint;
	};
	userPaidService: PubUserPaidService;
	ipv4?: string;
	ipv6?: string;
	user: {
		name: string;
		id: number;
	}
}

type PubVmInputVM = UserVirtualMachine & {
	User: User | null;
	UserPaidService: {
		expiresAt: Date | null;
		id: string;
		autoRenews?: boolean;
	};
};
export const getPubVm = async (
	vm: PubVmInputVM,
): Promise<PubVirtualMachine> => {
	const vmState = await getPubVMState(vm.id);

	const expiresAt = vm.UserPaidService.expiresAt;

	if (!vm.User) {
		throw new Error('User not found');
	}

	//console.log( vm.UserPaidService)

	return {
		id: vm.id,
		state: vmState,
		guestToolsRunning: true, //!!agentState,
		product: {
			name: vm.name,
			installStatus: vm.installStatus,
			cpuCores: vm.cpuCores,
			ramBytes: vm.ramBytes,
			diskBytes: vm.diskBytes,

		},
		userPaidService: {
			expiresAt: expiresAt,
			isExpired: !expiresAt || expiresAt < new Date(),
			id: vm.UserPaidService.id,
			autoRenews: vm.UserPaidService.autoRenews
		},

		ipv4: vm.primaryIpv4Address ?? undefined,
		ipv6: vm.primaryIpv6Address ?? undefined,
		user: {
			name: vm.User?.fullName ?? "Unknown",
			id: vm.User?.id ?? -1,
		}
	};
};

export const getPubVMS = async (vms: PubVmInputVM[]) => {
	return await Promise.all(
		vms.map(async (vm) => {
			const pubVm = await getPubVm(vm);
			return pubVm;
		}),
	);
};

type VmPermission = 'start_stop_server' | 'console' | 'manage_install'
export const __getVmEnsureAccess = async (id: string, user: PubJwtData, permission?: VmPermission) => {
	const vm = await prismaClient.userVirtualMachine.update({
		where: {
			id,
		},
		data: {
			lastAccessedAt: new Date(),
		},
		include: {
			User: true,
			UserPaidService: {
				select: {
					expiresAt: true,
					id: true,
				},
			},
		},
	});

	if (!vm) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `VM with id: ${id} not found`,
		});
	}

	if (user.roles.includes("ADMIN")) {
		// skip other validations if admin
		return vm;
	}

	if (vm.userId !== user.id) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not allowed to access this VM",
		});
	}

	if (vm.primaryIpv4Address === null) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "VM does not have a primary IPv4 address",
		});
	}

	return vm;
}


export const getVmEnsureAccess = async (id: string, ctx: AuthContext, permission?: VmPermission) => {
	return __getVmEnsureAccess(id, ctx.user, permission);
};
