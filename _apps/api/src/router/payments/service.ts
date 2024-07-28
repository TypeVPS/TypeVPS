import { z } from "zod";
import { router } from "..";
import { adminAuthProcedure, authProcedure } from "../auth";
import { prismaClient } from "@/db";
import { TRPCError } from "@trpc/server";
import { PAYMENT_PROVIDERS } from "../../payments/providers";
import { dateOrNow } from "../../payments";
import dayjs from "dayjs";
import { Subscription } from "@typevps/db";

export const getActiveSubscription = (subscriptions: Subscription[]) => {
	const sub = subscriptions.find(
		(sub) => sub.status === "ACTIVE" || sub.status === "ACTIVE_TRAILING",
	);

	return sub;
};

export const getUserPaidServiceDetails = async (id: string) => {
	const service = await prismaClient.userPaidService.findUnique({
		where: {
			id: id,
		},
		select: {
			expiresAt: true,
			UserVirtualMachine: {
				select: {
					id: true,
					name: true,
					ramBytes: true,
					diskBytes: true,
					cpuCores: true,
					monthlyPrice: true,
					description: true,
				},
			},
			Subscription: true,
		},
	});

	if (!service) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Service not found",
		});
	}

	const services: {
		type: "virtual-machine";
		id: string;
		description: string;
		monthlyPrice: number;
	}[] = [];

	for (const vm of service.UserVirtualMachine) {
		services.push({
			type: "virtual-machine",
			id: vm.id,
			description: vm.description,
			monthlyPrice: vm.monthlyPrice,
		});
	}

	const activeSubscription = getActiveSubscription(service.Subscription);

	return {
		expiresAt: service?.expiresAt,
		services,
		monthlyPrice: services.reduce((acc, cur) => acc + cur.monthlyPrice, 0),
		autoRenewOn: !!activeSubscription,
		activeSubscription: activeSubscription,
	};
};

export const userPaidServiceRouter = router({
	//list: authProcedure.input(z.object({})).query(({ ctx }) => { }),
	get: authProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ input }) => {
			return await getUserPaidServiceDetails(input.id);
		}),

	extend: adminAuthProcedure
		.input(
			z.object({
				id: z.string(),
				days: z.number(),
				updateSubscriptionNextBilling: z.boolean().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const service = await prismaClient.userPaidService.findFirst({
				where: {
					id: input.id,
				},
				select: {
					Subscription: true,
					expiresAt: true,
				},
			});

			if (!service) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Service with id ${input.id} not found`,
				});
			}

			const subscription = getActiveSubscription(service.Subscription);
			if (input.updateSubscriptionNextBilling && subscription) {
				const paymentProvider = PAYMENT_PROVIDERS[subscription.paymentProvider];
				if (!paymentProvider || !paymentProvider.subscription) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Payment provider ${subscription.paymentProvider} not found`,
					});
				}

				if (!subscription.paymentProviderSubscriptionId) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Payment provider subscription id not found",
					});
				}

				await paymentProvider.subscription?.updateNextBillingDate({
					nextBillingDate: dayjs(dateOrNow(subscription.expiresAt))
						.add(input.days, "days")
						.toDate(),
					paymentProviderSubscriptionId:
						subscription.paymentProviderSubscriptionId,
				});
			}

			await prismaClient.userPaidService.update({
				where: {
					id: input.id,
				},
				data: {
					expiresAt: dayjs(dateOrNow(service.expiresAt))
						.add(input.days, "days")
						.toDate(),
				},
			});
		}),
});
