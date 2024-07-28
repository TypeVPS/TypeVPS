import { prismaClient } from "@/db";
import { generateAndUploadCloudInitConfig } from "@/installUtils/cloudInit";
import { ensureTemplateImageExists } from "@/installUtils/image";
import { generateVmDescription, getProxmoxVmName, selectBestNode } from "@/installUtils/misc";
import { configureFirewall, configureNetwork } from "@/installUtils/network";
import { windowsPostInstall } from "@/installUtils/windows";
import proxmox, { getVMState, waitForStateRemoved } from "@/proxmox";
import { TRPCError } from "@trpc/server";
import { proxmoxApi } from "@typevps/proxmox";
import { generateVmId } from "@typevps/proxmox/src/proxmoxUtils";
import crypto from "crypto";
import { z } from "zod";
import { router } from "..";
import { LiveLogger, createLiveLogger, liveLogs } from "../../liveLogger";
import { authProcedure } from "../auth";
import { getVmEnsureAccess } from "./utils";
import { UserVirtualMachine } from "@typevps/db";

function generateShadowCompatibleHash(password: string) {
	/* 	// Generate the SHA-512 hash with salt
		const salt = crypto.randomBytes(16).toString('hex');
		const hash = crypto.createHash('sha512')
			.update(password + salt)
			.digest('hex');
	
		// Format the hash in a way compatible with /etc/shadow
		const shadowHash = `$6$${salt}$${hash}`;
	
		return shadowHash; */



	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.createHash('sha512')
		.update(password + salt)
		.digest('hex');

	return `$6$${salt}$${hash}`;

}

export const deleteVm = async (vm: UserVirtualMachine, liveLogger: LiveLogger) => {
	if (vm.installStatus !== "OK") {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `VM install status is ${vm.installStatus}. Expected OK`,
		});
	}

	const vmState = await getVMState(vm.id);
	if (!vmState) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `VM with ID ${vm.id} does not exist in proxmox`,
		});
	}

	if (vmState.status === "running") {
		liveLogger.log("Stopping VM");
		await proxmox.powerActionWait(vmState, vm.id, "stop");
	}

	liveLogger.log("Deleting VM");
	const { taskId } = await proxmoxApi.qemu.delete({
		node: vmState.node,
		vmid: vmState.vmid,
	});
	await proxmox.waitForTaskDone(taskId, 300_000);

	// wait for the vm to be deleted from state
	liveLogger.log("Waiting for VM to be deleted");
	await waitForStateRemoved(vm.id, 300_000);

	await prismaClient.userVirtualMachine.update({
		where: {
			id: vm.id,
		},
		data: {
			installStatus: "AWAITING_CONFIG",
		},
	});

	liveLogger.success("VM deleted successfully");
}

export const vmInstallRouter = router({
	listTemplates: authProcedure.query(async () => {
		const templates = await prismaClient.installTemplate.findMany({
			where: {},
			select: {
				id: true,
				name: true,
				osType: true
			}
		});

		return templates as {
			id: string;
			name: string;
			osType: 'LINUX' | 'WINDOWS'
		}[];
	}),
	liveLogs: authProcedure
		.input(
			z.object({
				liveLogId: z.string(),
			}),
		)
		.query(({ input, ctx }) => {
			const logs = liveLogs.get(input.liveLogId);

			if (!logs) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No logs found",
				});
			}

			return logs;
		}),

	delete: authProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const vm = await getVmEnsureAccess(input.id, ctx, 'manage_install');
			const { liveLogId } = createLiveLogger({
				type: 'deleteVm',
				dbVmId: vm.id,
				logic: async (liveLogger) => {
					await deleteVm(vm, liveLogger);
					
				}
			});

			return {
				liveLogId
			}
		}),

	install: authProcedure
		.input(
			z.object({
				type: z.enum(["iso", "template"]),
				templateId: z.string().optional(),
				isoId: z.string().optional(),

				id: z.string(),
				username: z.string(),
				password: z.string(),
				sshKeyIds: z.array(z.string()).optional(),
				customCloudInit: z.string().optional(),
				allowPasswordAuthentication: z.boolean().optional(),
				passwordLessSudo: z.boolean().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const vm = await getVmEnsureAccess(input.id, ctx, 'manage_install');
			const { liveLogId } = createLiveLogger({
				type: 'installVm',
				dbVmId: vm.id,
				logic: async (liveLogger) => {
					const expiresAt = vm.UserPaidService.expiresAt;
					if (!expiresAt || Date.now() > expiresAt.getTime()) {
						throw new TRPCError({
							code: "UNAUTHORIZED",
							message: `VM expired at ${expiresAt?.toISOString() ?? 'unknown'}`,
						});
					}

					if (vm.installStatus !== "AWAITING_CONFIG") {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: `VM install status is ${vm.installStatus}. Expected AWAITING_CONFIG`,
						});
					}

					if (input.type === "iso" && !input.isoId) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "ISO ID is required when type=iso",
						});
					}

					if (input.type === "template" && !input.templateId) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Template ID is required when type=template",
						});
					}

					const vmState = await getVMState(vm.id);
					if (vmState) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: `VM with ID ${vm.id} already exists in proxmox`,
						});
					}

					liveLogger.log("Fetching SSH keys...");
					const sshKeys = await prismaClient.sshKey.findMany({
						where: {
							id: {
								in: input.sshKeyIds ?? ["_"],
							},
							userId: ctx.user.id,
						},
					});
					if (input.sshKeyIds && sshKeys.length !== input.sshKeyIds?.length) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "SSH keys not found",
						});
					}

					liveLogger.log("Fetching template...");
					const template = await prismaClient.installTemplate.findFirst({
						where: {
							id: input.templateId,
						},
					});

					if (!template) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Template not found",
						});
					}

					liveLogger.log("Updating VM status...");
					const USERNAME = template.osType === 'WINDOWS' ? 'Administrator' : input.username

					await prismaClient.userVirtualMachine.update({
						where: {
							id: vm.id,
						},
						data: {
							installStatus: "INSTALLING",
							vmUsername: USERNAME,
							vmPassword: input.password,
						},
					});

					liveLogger.log("Selecting best node...");
					const node = await selectBestNode({
						ramBytes: Number(vm.ramBytes),
						cpuCores: Number(vm.cpuCores),
						storageBytes: Number(vm.diskBytes),
					});


					if (!template) {
						throw new Error("Template not found");
					}

					liveLogger.log("Creating VM...");
					if (input.type === "template") {
						const passwordHashed = generateShadowCompatibleHash(input.password)

						liveLogger.log("Uploading cloud init template...");
						const cloudInit = await generateAndUploadCloudInitConfig({
							user: {
								username: input.username,
								password: passwordHashed,
								lockPassword: input.allowPasswordAuthentication ?? false,
								passwordAuthentication: input.allowPasswordAuthentication ?? true,
								passwordLessSudo: true,
								sshKeys: sshKeys.map((k) => k.key),
							},
							os: {
								hostname: vm.id,
								updatePackages: true,
							},
							type: template.osType,
						});

						//console.log(`cloud init id: ${cloudInit.id}, password: ${passwordHashed}`)
						const vmName = getProxmoxVmName({
							userId: ctx.user.id,
							userFullName: ctx.user.fullName,
							vmId: vm.id,
						});

						const storage = 'local'

						const image = await ensureTemplateImageExists(template, node, liveLogger);
						const vmid = await generateVmId(node);
						const sizeGb = Math.floor(Number(vm.diskBytes) / 1024 / 1024 / 1024);

						liveLogger.log("Creating VM...");
						const { taskId } = await proxmoxApi.qemu.create({
							node,
							vmid,
						}, {
							name: vmName,
							cpu: 'host',
							description: generateVmDescription(vm),
							ostype: template.osType === 'WINDOWS' ? 'win10' : 'l26',
							bios: template.osType === 'WINDOWS' ? 'ovmf' : 'seabios',
							bootdisk: 'scsi0',
							cores: vm.cpuCores,
							sockets: 1,
							memory: `${vm.ramBytes / BigInt(1024) / BigInt(1024)}`,
							//ide2: `${image},media=cdrom`,
							net0: `virtio,bridge=vmbr0`,
							onboot: true,
							//scsi0: `${storage}:0,size=100G,import-from=${image.directPath}`,
							ide2: `${storage}:cloudinit,media=cdrom`, // This sets the ide2 drive to use a cloud-init image.
							cicustom: `user=cloudinit:snippets/${cloudInit.id}.yml`,

							// fstrim_cloned_disks=1
							agent: 'enabled=1,fstrim_cloned_disks=1',

							// set scsi0 to VirtIO SCSI
							scsihw: 'virtio-scsi-single',

							// add efi
							efidisk0: `${storage}:1,efitype=4m,pre-enrolled-keys=1,format=qcow2`,

							// add virtio disk
							virtio0: `${storage}:0,format=qcow2,iothread=on,import-from=${image.directPath}`,



							//efidisk0: `${storage}:1,efitype=4m,pre-enrolled-keys=1,format=qcow2,import-from=${image.directPath}`,

						})
						await proxmox.waitForTaskDone(taskId, 300_000);

						// expand disk
						liveLogger.log("Expanding disk...");
						await proxmoxApi.qemu.expandDisk({
							node,
							vmid,
						}, {
							disk: 'virtio0',
							size: `${vm.diskBytes / BigInt(1024) / BigInt(1024) / BigInt(1024)}G`
						})


						const vmState = await getVMState(vm.id, 10);
						if (!vmState) {
							throw new Error("VM state not found");
						}

						const ipAddresses_ = await prismaClient.assignedIpAddress.findMany({
							where: {
								userVirtualMachineId: vm.id,
							},
							select: {
								IpAddress: true,
							},
						});
						const ipAddresses = ipAddresses_.map((a) => a.IpAddress);

						const sharedOpts = {
							vmId: vm.id,
							ipAddresses,
							state: vmState,
							vmIdObj: {
								node,
								vmid,
							},
						};
						liveLogger.log(`Configuring VM: Options: ${JSON.stringify(sharedOpts)}`);

						liveLogger.log("Configuring VM (NETWORK)...");
						await configureNetwork(sharedOpts);

						liveLogger.log("Configuring VM (FIREWALL)...");
						await configureFirewall(sharedOpts);

						liveLogger.log("Starting VM...");
						await proxmox.powerActionWait({ node, vmid }, vm.id, "start");

						// wait for agent to be online
						liveLogger.log("Waiting for VM agent to be online...");
						if (!(await proxmox.waitForAgentOnline({ node, vmid }))) {
							throw new Error("VM agent did not come online");
						}

						// if windows, then run post install powershell script
						if (template.osType === 'WINDOWS') {
							liveLogger.log("Running post install script... (WINDOWS)");
							await windowsPostInstall({
								vmId: vm.id,
								vmIdObj: {
									node,
									vmid,
								},
								state: vmState,
								password: input.password,
								username: USERNAME
							})
						}
						if (template.osType === 'LINUX') {
							await proxmoxApi.agent.setPassword({ node, vmid }, input.username, input.password)
						}

						liveLogger.log("Updating VM status...");
						// update status to installed
						await prismaClient.userVirtualMachine.update({
							where: {
								id: vm.id,
							},
							data: {
								installStatus: "OK",
							},
						});

						liveLogger.success("VM installed successfully");
					}
				}
			});

			return {
				liveLogId
			}
		}),

	remove: authProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const vm = await getVmEnsureAccess(input.id, ctx);

			if (vm.installStatus !== "OK") {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `VM install status is ${vm.installStatus}. Expected OK`,
				});
			}

			const vmState = await getVMState(vm.id);
			if (!vmState) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `VM with ID ${vm.id} does not exist in proxmox`,
				});
			}

			const { taskId } = await proxmoxApi.qemu.delete({
				node: vmState.node,
				vmid: vmState.vmid,
			});
			await proxmox.waitForTaskDone(taskId);

			await prismaClient.userVirtualMachine.update({
				where: {
					id: vm.id,
				},
				data: {
					installStatus: "AWAITING_CONFIG",
				},
			});
		}),
});
