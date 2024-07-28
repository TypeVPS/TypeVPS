import { Prisma } from "@typevps/db";
import { z } from "zod";
import { router } from "..";
import { prismaClient } from "@/db";
import { authProcedure } from "../auth";
import { vmAgentRouter } from "./agent";
import { getPubVMS as getPubVms, getPubVm, getVmEnsureAccess } from "./utils";
import proxmox, { getVmNodeId } from "@/proxmox";
import { proxmoxApi } from "@typevps/proxmox";
import datalix from "../../datalix";

interface DDOSIncident {
	ip: string;
	mpbs: number;
	pps: number;
	method: string;
	mode: string;
	date: Date
}

export const vmRouter = router({
	agent: vmAgentRouter,
	list: authProcedure
		.input(
			z.object({
				all: z.boolean().optional(),
				query: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where: Prisma.UserVirtualMachineWhereInput = {
				firstPaymentConfirmed: true,
				userId: ctx.user.id,
			};
			if (input.all && ctx.isAdmin()) {
				where.userId = undefined;
			}

			const vms = await prismaClient.userVirtualMachine.findMany({
				where,
				include: {
					User: true,
					UserPaidService: true,
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			return getPubVms(vms);
		}),
	get: authProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const vm = await getVmEnsureAccess(input.id, ctx);

			return getPubVm(vm);
		}),
	powerAction: authProcedure
		.input(
			z.object({
				id: z.string(),
				action: z.enum(["start", "stop", "reboot"]),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const vm = await getVmEnsureAccess(input.id, ctx);
			const vmNodeId = await getVmNodeId(input.id);

			await proxmox.powerActionWait(vmNodeId, vm.id, input.action);

			return true;
		}),
	graph: authProcedure
		.input(
			z.object({
				id: z.string(),
				timeframe: z.enum(["hour", "day", "week", "month", "year"]),
			}),
		)
		.query(async ({ input, ctx }) => {
			await getVmEnsureAccess(input.id, ctx);
			const vmNodeId = await getVmNodeId(input.id);

			const graph = await proxmoxApi.qemu.getRDD(vmNodeId, {
				cf: "AVERAGE",
				timeframe: input.timeframe,
			});

			return graph;
		}),

	getLoginCredentials: authProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const vm = await getVmEnsureAccess(input.id, ctx);

			return {
				username: vm.vmUsername,
				password: vm.vmPassword,
				ipv4: vm.primaryIpv4Address,
			};
		}),
	ddosIncidents: authProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const vm = await getVmEnsureAccess(input.id, ctx);
			const incidents = await datalix.getDdosIncidents();
			const ipIncidents = incidents.data.filter(incident => incident.ip === vm.primaryIpv4Address)

			return ipIncidents.map(incident => ({
				date: incident.created_on,
				ip: incident.ip,
				method: incident.method,
				mode: incident.mode,
				mpbs: incident.mbps,
				pps: incident.pps
			} as DDOSIncident)).sort((a, b) => b.date.getTime() - a.date.getTime());
		})

});
