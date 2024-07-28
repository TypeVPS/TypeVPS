import { z } from "zod";
import { router } from "..";
import { authProcedure } from "../auth";
import { getVmEnsureAccess } from "./utils";
import { getVmNodeId } from "@/proxmox";
import { proxmoxApi } from "@typevps/proxmox";
import { prismaClient } from "@/db";

export const vmAgentRouter = router({
	users: authProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			await getVmEnsureAccess(input.id, ctx);
			const vmNodeId = await getVmNodeId(input.id);

			const users = await proxmoxApi.agent.getUsers(vmNodeId);

			return users.map((user) => ({
				name: user.user,
				loginTime: new Date(user["login-time"]),
			}));
		}),

	setPassword: authProcedure
		.input(
			z.object({
				id: z.string(),
				osUsername: z.string(),
				password: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await getVmEnsureAccess(input.id, ctx);
			const vmNodeId = await getVmNodeId(input.id);
			await proxmoxApi.agent.setPassword(vmNodeId, input.osUsername, input.password);
			await prismaClient.userVirtualMachine.update({
				where: {
					id: input.id,
				},
				data: {
					vmPassword: input.password,
				},
			});
		}),

	/* 
	sshKeys: authProcedure.input(z.object({
		id: z.string(),
	})).query(async ({ctx, input}) => {
		const vm = await getVmEnsureAccess(input.id, ctx)

		return vm.sshKeys
	}) */
});
