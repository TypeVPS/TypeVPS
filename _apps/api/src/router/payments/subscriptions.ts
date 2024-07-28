import { PaymentProviderType } from "@typevps/db";
import { z } from "zod";
import { router } from "..";
import { prismaClient } from "@/db";
import { paymentEventEmitter } from "../../payments/events";
import { PAYMENT_PROVIDERS } from "../../payments/providers";

import { authProcedure } from "../auth";
import {
	getPaymentProvider,
	getUserPaidServiceGeneralInput,
	getUserPaidServiceId,
} from "./utils";

export const SUBSCRIPTION_SELECT = {
	//UserVirtualMachine: true,
	User: true,
	price: true,
	status: true,
	id: true,
	createdAt: true,
	cancelledAt: true,
	expiresAt: true,
	paymentProvider: true,
};

export const subscriptionRouter = router({
	list: authProcedure
		.input(
			z.object({
				listAllUsers: z.boolean().optional(),
			}),
		)
		.query(({ ctx, input }) => {
			if (input.listAllUsers) {
				ctx.ensureRole("ADMIN");
			}

			return prismaClient.subscription.findMany({
				where: {
					userId: input.listAllUsers ? undefined : ctx.user.id,
				},
				select: { ...SUBSCRIPTION_SELECT },
			});
		}),
	order: authProcedure
		.input(
			z.object({
				//type: z.enum(["new", "existing"]),
				productId: z.string().optional(),
				paymentProvider: z.nativeEnum(PaymentProviderType),

				existingUserPaidServiceId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const paymentProvider = getPaymentProvider(input.paymentProvider);
			if (!paymentProvider.subscription) {
				throw new Error(
					`Payment provider ${input.paymentProvider} does not support subscriptions`,
				);
			}

			const userPaidServiceId = await getUserPaidServiceId({
				user: ctx.user,
				productId: input.productId,
				existingUserPaidServiceId: input.existingUserPaidServiceId,
			});
			const paymentProviderInput = await getUserPaidServiceGeneralInput(
				userPaidServiceId,
			);

			const subscription = await prismaClient.subscription.create({
				data: {
					paymentProvider: input.paymentProvider,
					userId: ctx.user.id,
					price: paymentProviderInput.totalPrice,
					userPaidServiceId,
				},
			});

			const paymentProviderOutput = await paymentProvider.subscription?.create(
				paymentProviderInput,
			);

			if (!paymentProviderOutput.providerPaymentId) {
				throw new Error("Provider payment id not found");
			}

			await prismaClient.subscription.update({
				where: {
					id: subscription.id,
				},
				data: {
					paymentProviderId: paymentProviderOutput.providerPaymentId,
					paymentProviderSubscriptionId:
						paymentProviderOutput.providerPaymentId,
				},
			});

			return {
				providerPaymentUrl: paymentProviderOutput.providerPaymentUrl,
			};
		}),
	cancel: authProcedure
		.input(
			z.object({
				subscriptionId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const subscription = await prismaClient.subscription.findUnique({
				where: {
					id: input.subscriptionId,
				},
				include: {
					User: true,
				},
			});

			if (!subscription) {
				throw new Error("Subscription not found");
			}

			if (subscription.userId !== ctx.user.id && !ctx.isAdmin()) {
				throw new Error(
					"You do not have permission to cancel this subscription",
				);
			}

			const provider = PAYMENT_PROVIDERS[subscription.paymentProvider];
			if (!provider.isEnabled) {
				throw new Error(
					`Payment provider ${subscription.paymentProvider} is not enabled`,
				);
			}

			if (!provider.subscription) {
				throw new Error(
					`Payment provider ${subscription.paymentProvider} does not support subscriptions`,
				);
			}
			if (
				!subscription.paymentProviderId ||
				!subscription.paymentProviderSubscriptionId
			) {
				throw new Error("Subscription does not have a payment provider id");
			}

			await provider.subscription.cancel({
				paymentProviderId: subscription.paymentProviderId,
				paymentProviderSubscriptionId:
					subscription.paymentProviderSubscriptionId,
			});

			// wait for the subscription to be cancelled
			await paymentEventEmitter.onceAwaited(
				"subscription:updated",
				60_000,
				(event) => {
					if (event.subscriptionId !== subscription.id) return false;
					return true;
				},
			);

			// wait for

			/* 		await prismaClient.subscription.update({
			where: {
				id: subscription.id
			},
			data: {
				cancelledAt: new Date()
			}
		})
 */
			return {
				success: true,
			};
		}),
});
