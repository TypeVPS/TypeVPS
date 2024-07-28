import { PaymentProviderType, Product } from "@typevps/db";
import { prismaClient } from "@/db";
import { ENV } from "../../env";
import { GeneralInput } from "../../payments";
import { TRPCError } from "@trpc/server";
import { PubJwtData } from "../auth";
import { PAYMENT_PROVIDERS } from "../../payments/providers";
import { sizeBytesToHumanBigInt } from "@typevps/shared";

export const getUserPaidServiceId = async (input: {
	productId?: string;
	existingUserPaidServiceId?: string;
	user: PubJwtData;
}) => {
	if (input.existingUserPaidServiceId) {
		return input.existingUserPaidServiceId;
	}

	if (!input.productId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "productId is required",
		});
	}

	const { product } = await validateProductForPayment(
		input.productId,
	);

	const userPaidService = await prismaClient.userPaidService.create({
		data: {
			userId: input.user.id,
		},
	});

	await createPaymentProduct(input.user, product, userPaidService.id);
	return userPaidService.id;
};

export const getUserPaidServiceGeneralInput = async (
	userPaidServiceId: string,
) => {
	const userPaidService = await prismaClient.userPaidService.findFirst({
		where: {
			id: userPaidServiceId,
		},
		include: {
			UserVirtualMachine: true,
			User: true,
		},
	});

	if (!userPaidService) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `UserPaidService ${userPaidServiceId} not found`,
		});
	}

	const generalInput: GeneralInput = {
		customerEmail: userPaidService.User.email,
		products: [],
		returnUrl: `${ENV.BASE_URL}/servers`,
		totalPrice: 0, // will be calculated later
		startAt: userPaidService.expiresAt ?? undefined,
	};
	if (userPaidService.UserVirtualMachine) {
		for (const vm of userPaidService.UserVirtualMachine) {
			generalInput.products.push({
				currency: ENV.CURRENCY,
				name: vm.name,
				price: vm.monthlyPrice,
				description: `${vm.name} - ${vm.cpuCores
					} vCPU - ${sizeBytesToHumanBigInt(
						vm.ramBytes,
					)} ram - ${sizeBytesToHumanBigInt(vm.diskBytes)} disk`,
			});
		}
	}

	// calculate total price
	generalInput.totalPrice = generalInput.products.reduce(
		(acc, product) => acc + product.price,
		0,
	);

	return generalInput;
};

export const getPaymentProvider = (providerName: PaymentProviderType) => {
	const provider = PAYMENT_PROVIDERS[providerName];
	if (!provider?.isEnabled) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Payment provider ${providerName} is not enabled`,
		})
	}

	return provider;
};

export const validateProductForPayment = async (productId: string) => {
	const product = await prismaClient.product.findFirst({
		where: {
			id: productId,
		},
	});

	if (!product) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Product ${productId} not found`,
		});
	}

	if (product.monthlyPrice === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Product ${productId} is free`,
		});
	}

	if (product.disabledAt) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Product ${productId} is disabled`,
		});
	}

	return {
		monthlyPrice: product.monthlyPrice,
		product: product,
	};
};

// Note: This is called when the payment is initialized, not when the payment is completed / paid / failed.
export const createPaymentProduct = async (
	user: PubJwtData,
	product: Product,
	userPaidServiceId: string,
) => {
	const userVirtualMachine = await prismaClient.userVirtualMachine.create({
		data: {
			userId: user.id,
			cpuCores: product.cpuCores,
			description: product.description,
			diskBytes: product.diskBytes,
			name: product.name,
			ramBytes: product.ramBytes,
			networkBandwidthBurstMegabit: product.networkBandwidthBurstMegabit,
			networkBandwidthBytes: product.networkBandwidthBytes,
			networkBandwidthDedicatedMegabit:
				product.networkBandwidthDedicatedMegabit,
			type: product.type,
			userPaidServiceId: userPaidServiceId,
			monthlyPrice: product.monthlyPrice,
		},
		select: {
			id: true,
		},
	});

	return {
		userVirtualMachine,
	};
};
