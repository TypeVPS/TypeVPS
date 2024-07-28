import { router } from ".";
import { prismaClient } from "@/db";
import { adminAuthProcedure } from "./auth";
import { z } from "zod";
import { SUBSCRIPTION_SELECT } from "./payments/subscriptions";
import { PAYMENT_SELECT } from "./payments/payments";
import { getPubVMS } from "./vms/utils";
import { TRPCError } from "@trpc/server";

export const PUB_USER_SELECT = {
	id: true,
	email: true,
	roles: true,
	createdAt: true,
	fullName: true,
};

export const userRouter = router({
	list: adminAuthProcedure.query(async () => {
		const users = await prismaClient.user.findMany({
			select: PUB_USER_SELECT,
		});
		return users;
	}),
	get: adminAuthProcedure
		.input(
			z.object({
				id: z.number(),
			}),
		)
		.query(async ({ input }) => {
			const user = await prismaClient.user.findUnique({
				where: {
					id: input.id,
				},
				select: {
					...PUB_USER_SELECT,
					UserVirtualMachines: {
						include: {
							User: true,
							UserPaidService: true,
						},
					},
					Subscriptions: {
						select: {
							...SUBSCRIPTION_SELECT,
						},
					},
					Payments: {
						select: {
							...PAYMENT_SELECT,
						},
					},
				},
			});
			if (!user) throw new TRPCError({
				code: "NOT_FOUND",
				message: `User with id ${input.id} not found.`
			})
			return {
				...user,
				UserVirtualMachines: await getPubVMS(user.UserVirtualMachines),
			};
		}),
});
