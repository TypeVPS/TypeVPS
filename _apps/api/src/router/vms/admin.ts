import { z } from "zod";
import { router } from "..";
import { adminAuthProcedure } from "../auth";
import { prismaClient } from "@/db";
import { proxmoxApi } from "@typevps/proxmox";
import { deleteVm, vmInstallRouter } from "./install";
import { TRPCError } from "@trpc/server";
import { VMState, zod } from "@typevps/shared";
import proxmox from "@/proxmox";
import dayjs from "dayjs";
import { getVMState } from "@/proxmox";
import { generateRandomMacAddress } from "../admin/ips";
import { PAYMENT_PROVIDERS } from "../../payments/providers";
import { subscriptionRouter } from "../payments/subscriptions";
import { getProxmoxVmName } from "@/installUtils/misc";
import { configureFirewall } from "@/installUtils/network";
import { createLiveLogger } from "@/liveLogger";

export const vmAdminRouter = router({
	delete: adminAuthProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const liveLogger = createLiveLogger({
				type: "VM_ADMIN_DELETE",
				dbVmId: input.id,
			})
			const vm = await prismaClient.userVirtualMachine.findUnique({
				where: {
					id: input.id,
				},
				include: {
					UserPaidService: {
						select: {
							Subscription: {
								where: {
									status: {
										in: ["ACTIVE", "ACTIVE_TRAILING"],
									}
								}
							}
						}
					}
				}
			})

			if (!vm) throw new TRPCError({
				code: "NOT_FOUND",
				message: "VM not found"
			})

			// is there a subscription? then cancel it
			// loop through all subscriptions and cancel them
			const subscriptionCaller = subscriptionRouter.createCaller(ctx)
			for (const subscription of vm.UserPaidService.Subscription) {
				liveLogger.log(`Cancelling subscription ${JSON.stringify(subscription)}`)
				await subscriptionCaller.cancel({
					subscriptionId: subscription.id,
				})
			}

			// get vm state
			const state = await getVMState(vm.id)
			if (state) {
				liveLogger.log(`VM state is ${JSON.stringify(state)}, deleting...`)
				await deleteVm(vm, liveLogger)
			}

			// delete vm from database
			await prismaClient.userVirtualMachine.delete({
				where: {
					id: vm.id
				}
			})

			liveLogger.success("VM deleted")
		}),



	forcesInstallStateToPendingInstall: adminAuthProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			await prismaClient.userVirtualMachine.update({
				where: {
					id: input.id,
				},
				data: {
					installStatus: "AWAITING_CONFIG",
				},
			});
		}),

	listNotImportedVms: adminAuthProcedure.query(async () => {
		const resources = await proxmoxApi.cluster.getQemuResources();
		const existingVms = await prismaClient.userVirtualMachine.findMany({
			select: {
				id: true,
			},
		});

		const existingVmIds = existingVms.map((r) => r.id);
		const notImportedVms = resources.filter((r) => {
			const _name = r.name.split("-");
			if (_name.length !== 3) return true;
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const [userName, userId, vmId] = _name;

			return !existingVmIds.includes(vmId);
		});

		return {
			vms: notImportedVms.map((r) => {
				return {
					name: r.name,
					node: r.node,
					vmid: r.vmid,
					maxMem: r.maxmem,
					mem: r.mem,
					status: r.status,
					uptime: r.uptime,
					cpu: r.maxcpu,
				};
			}),
		};
	}),
	deleteNotImportedVm: adminAuthProcedure
		.input(
			z.object({
				node: z.string(),
				vmid: z.number(),
			}),
		)
		.mutation(async ({ input }) => {
			await proxmoxApi.qemu.powerAction(
				{
					node: input.node,
					vmid: input.vmid,
				},
				"stop",
			);

			// wait 2s for the vm to stop
			await new Promise((r) => setTimeout(r, 2000));

			await proxmoxApi.qemu.delete({
				node: input.node,
				vmid: input.vmid,
			});
		}),

	importVm: adminAuthProcedure
		.input(
			z.object({
				node: z.string(),
				vmid: z.number(),
				userId: z.number(),
				monthlyPrice: z.number(),
				validForDays: z.number(),
			}).merge(zod.admin.addIpPrefix)
		)
		.mutation(async ({ input }) => {
			const vm = await proxmoxApi.cluster
				.getQemuResources()
				.then((r) =>
					r.find((r) => r.node === input.node && r.vmid === input.vmid),
				);

			if (!vm)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `VM with id ${input.node}:${input.vmid} not found.`,
				});

			// create user paid service
			const userPaidService = await prismaClient.userPaidService.create({
				data: {
					userId: input.userId,
					expiresAt: dayjs().add(input.validForDays, "day").toDate(),

					firstPaymentConfirmed: true,
				},
			});

			// create vm
			const dbVm = await prismaClient.userVirtualMachine.create({
				data: {
					userId: input.userId,
					installStatus: "OK",
					cpuCores: vm.maxcpu,
					description: "imported",
					diskBytes: vm.disk,

					monthlyPrice: input.monthlyPrice,
					ramBytes: vm.mem,
					name: "imported",
					networkBandwidthBurstMegabit: 1000,
					networkBandwidthBytes: -1,
					networkBandwidthDedicatedMegabit: 100,
					type: "VPS",
					firstPaymentConfirmed: true,
					userPaidServiceId: userPaidService.id,
					AssignedIpAddress: {
						create: {
							IpAddress: {
								create: {
									address: input.ipAddress,
									kind: input.ipKind,
									subnet: input.ipSubnet,
									gateway: input.ipGateway,
									macAddress: generateRandomMacAddress()
								}
							}
						}
					},
					primaryIpv4Address: input.ipAddress,
				},
				include: {
					User: true,
					AssignedIpAddress: {
						select: {
							IpAddress: true,
						}
					}
				},

			});

			await proxmoxApi.qemu.editVmConfig(
				{
					node: input.node,
					vmid: input.vmid,
				},
				{
					vmName: getProxmoxVmName({
						userId: dbVm.User.id,
						userFullName: dbVm.User.fullName,
						vmId: dbVm.id,
					}),
				},
			);

			let state: VMState | undefined;
			let currentRetry = 0;
			while (!state) {
				if (currentRetry >= 120) break;
				await new Promise((r) => setTimeout(r, 1000));

				state = await getVMState(dbVm.id);
				currentRetry++;
			}
			if (!state) throw new Error("VM not found");

			const sharedOpts = {
				vmId: vm.id,
				ipAddresses: dbVm.AssignedIpAddress.map((r) => r.IpAddress),
				state: state,
				vmIdObj: {
					node: input.node,
					vmid: input.vmid
				},
			};

			//await configureNetwork(sharedOpts);
			await configureFirewall(sharedOpts);
		}),
});
