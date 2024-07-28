import { PaymentProviderType } from "@typevps/db";
import { z } from "zod";
import { router } from "..";
import { prismaClient } from "@/db";
import { authProcedure } from "../auth";
import {
	getPaymentProvider,
	getUserPaidServiceGeneralInput,
	getUserPaidServiceId,
} from "./utils";

export const PAYMENT_SELECT = {
	//UserVirtualMachine: true,
	User: true,
	price: true,
	status: true,
	id: true,
	createdAt: true,
	paymentProvider: true,
};

export const paymentRouter = router({
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

			return prismaClient.payment.findMany({
				where: {
					userId: input.listAllUsers ? undefined : ctx.user.id,
				},
				select: PAYMENT_SELECT,
			});
		}),
	order: authProcedure
		.input(
			z.object({
				productId: z.string().optional(),
				paymentProvider: z.nativeEnum(PaymentProviderType),
				existingUserPaidServiceId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const paymentProvider = getPaymentProvider(input.paymentProvider);
			const userPaidServiceId = await getUserPaidServiceId({
				user: ctx.user,
				productId: input.productId,
				existingUserPaidServiceId: input.existingUserPaidServiceId,
			});
			const paymentProviderInput = await getUserPaidServiceGeneralInput(
				userPaidServiceId,
			);

			const payment = await prismaClient.payment.create({
				data: {
					paymentProvider: input.paymentProvider,
					userPaidServiceId: userPaidServiceId,
					userId: ctx.user.id,
					price: paymentProviderInput.totalPrice,
				},
			});

			const paymentProviderOutput = await paymentProvider.payment.create(
				paymentProviderInput,
			);
			if (!paymentProviderOutput.providerPaymentId) {
				throw new Error("Payment provider did not return a payment url");
			}

			await prismaClient.payment.update({
				where: {
					id: payment.id,
				},
				data: {
					paymentProviderId: paymentProviderOutput.providerPaymentId,
				},
			});

			return {
				providerPaymentUrl: paymentProviderOutput.providerPaymentUrl,
			};
		}),
});
