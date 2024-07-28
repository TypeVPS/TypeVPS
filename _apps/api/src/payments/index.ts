import {
	PaymentProviderType,
	PaymentStatus,
	SubscriptionStatus,
	UserPaidService,
	UserVirtualMachine,
} from "@typevps/db";
import dayjs from "dayjs";
import { prismaClient } from "@/db";
import { Currency } from "../env";
import { paymentEventEmitter } from "./events";
import { pinoLogger } from "../log";
import { FastifyInstance } from "fastify";
import { sendInvoice } from "../accounting/invoice";

const logger = pinoLogger.child({ module: "payment-providers" });

export interface GeneralInput {
	//paymentId: string
	returnUrl: string;
	customerEmail: string;

	products: {
		name: string;
		price: number;
		currency: Currency;
		description: string;
	}[];
	totalPrice: number;

	startAt?: Date;
}

export interface UpdateSubscriptionPriceInput {
	paymentProviderSubscriptionId: string;
	newPrice: number;
}

export interface UpdateSubscriptionNextBillingDateInput {
	paymentProviderSubscriptionId: string;
	nextBillingDate: Date;
}

export interface GeneralOutput {
	providerPaymentUrl: string;
	providerPaymentId: string;
	provider: PaymentProviderType;
}

export interface CancelSubscriptionInput {
	paymentProviderSubscriptionId: string;
	paymentProviderId: string;
}

export interface PaymentProvider {
	payment: {
		create: (input: GeneralInput) => Promise<GeneralOutput>;
	};
	subscription?: {
		create: (input: GeneralInput) => Promise<GeneralOutput>;
		cancel: (input: CancelSubscriptionInput) => Promise<void>;
		updatePrice: (input: UpdateSubscriptionPriceInput) => Promise<void>;
		updateNextBillingDate: (
			input: UpdateSubscriptionNextBillingDateInput,
		) => Promise<void>;
	};
	isEnabled: boolean;
	type: "card" | "crypto";
	prettyName?: string;
	webhook?: (app: FastifyInstance) => Promise<void>;
}

export const updateSubscriptionStatus = async (opts: {
	status: SubscriptionStatus;
	cancelledAt?: Date;
	expiresAt?: Date;
	paymentProviderSubscriptionId: string;
}) => {
	logger.info(
		`Updating subscription ${opts.paymentProviderSubscriptionId}: ${opts.status}`,
	);

	const oldStatus = await prismaClient.subscription.findFirst({
		where: {
			paymentProviderSubscriptionId: opts.paymentProviderSubscriptionId,
		},
		select: {
			status: true,
		},
	});
	if (!oldStatus) {
		logger.warn(`Subscription ${opts.paymentProviderSubscriptionId} not found`);
		return;
	}

	const dbSubscription = await prismaClient.subscription.update({
		where: {
			paymentProviderSubscriptionId: opts.paymentProviderSubscriptionId,
		},
		data: {
			status: opts.status,
			cancelledAt: opts.cancelledAt,
			expiresAt: opts.expiresAt,
			UserPaidService: {
				update: {
					autoRenews: ['ACTIVE', 'ACTIVE_TRAILING'].includes(opts.status) ? true : false,
				}
			}
		},
		include: {
			UserPaidService: {
				include: {
					UserVirtualMachine: true,
				},
			},
		},
	});
	if (!dbSubscription || !dbSubscription.UserPaidService) {
		throw new Error(
			`Subscription ${opts.paymentProviderSubscriptionId} not found or UserPaidService null`,
		);
	}

	if (opts.status === "ACTIVE") {
		if (dbSubscription.UserPaidService) {
			await extendService({
				userPaidService: dbSubscription.UserPaidService,
				extendBy: {
					amount: 1,
					unit: "months",
				},
			});
		}
	}

	paymentEventEmitter.emit("subscription:updated", {
		subscriptionId: dbSubscription.id,
		paymentProviderSubscriptionId: dbSubscription.paymentProviderSubscriptionId,
		paymentProvider: dbSubscription.paymentProvider,
	});
};

export const updatePaymentStatus = async (opts: {
	status: PaymentStatus;
	paymentProviderId: string;
}) => {
	// does the payment exist?
	const paymentExists = await prismaClient.payment.findFirst({
		where: {
			paymentProviderId: opts.paymentProviderId,
		},
		select: {
			id: true,
		},
	});
	if (!paymentExists) {
		logger.warn(`Payment ${opts.paymentProviderId} not found`, opts.status);
		return;
	}

	const payment = await prismaClient.payment.update({
		where: {
			paymentProviderId: opts.paymentProviderId,
		},
		data: {
			status: opts.status,
		},
		include: {
			UserPaidService: {
				include: {
					UserVirtualMachine: true,
				},
			},
		},
	});

	if (opts.status === "COMPLETED") {
		if (payment.UserPaidService) {
			await extendService({
				userPaidService: payment.UserPaidService,
				extendBy: {
					amount: 1,
					unit: "months",
				},
			});
		}
	}
};

// ipv6 is not supported yet
const assignIpsToUserVirtualMachine = async (
	userVirtualMachine: UserVirtualMachine,
	ipsAmount: number,
) => {
	const ips = await prismaClient.ipAddress.findMany({
		where: {
			AssignedIpAddress: null,
			kind: "IPV4",
		},
		take: ipsAmount,
	});
	if (ips.length !== ipsAmount) {
		throw new Error("Not enough ips available");
	}

	await prismaClient.assignedIpAddress.createMany({
		data: ips.map((ip) => ({
			ipAddressId: ip.id,
			userVirtualMachineId: userVirtualMachine.id,
		})),
	});

	// assign primary ip to user virtual machine
	await prismaClient.userVirtualMachine.update({
		where: {
			id: userVirtualMachine.id,
		},
		data: {
			primaryIpv4Address: ips[0].address,
		},
	});
};

const postInitialSetup = async (userVirtualMachine: UserVirtualMachine) => {
	logger.info(`Post initial setup for ${userVirtualMachine.id}`);

	await assignIpsToUserVirtualMachine(userVirtualMachine, 1);
};

export const dateOrNow = (date: Date | null) => {
	if (!date) return Date.now();
	if (date.getTime() < Date.now()) return Date.now();
	return date.getTime();
};

export const extendService = async (opts: {
	userPaidService: UserPaidService & {
		UserVirtualMachine: UserVirtualMachine[];
	};
	extendBy: {
		unit: dayjs.ManipulateType;
		amount: number;
	};
}) => {
	logger.info("Extending user paid service period");

	// extend expiresAt
	await prismaClient.userPaidService.update({
		where: {
			id: opts.userPaidService.id,
		},
		data: {
			expiresAt: dayjs(dateOrNow(opts.userPaidService.expiresAt))
				.add(opts.extendBy.amount, opts.extendBy.unit)
				.toDate(),
		},
	});

	sendInvoice({
		duration: {
			amount: opts.extendBy.amount,
			unit: opts.extendBy.unit,
		},
		userId: opts.userPaidService.userId,
		userPaidServiceId: opts.userPaidService.id,
	}).catch((err) => {
		logger.error(err);
		throw err;
	});


	// run post initial on products if needed
	for (const vm of opts?.userPaidService?.UserVirtualMachine ?? []) {
		if (!vm.firstPaymentConfirmed) {
			try {
				await postInitialSetup(vm);
			} catch (err) {
				logger.error(err);
			}
		}
	}

	// mark products as firstPaymentConfirmed
	await prismaClient.userVirtualMachine.updateMany({
		where: {
			id: {
				in: opts.userPaidService.UserVirtualMachine?.map((vms) => vms.id) ?? [],
			},
		},
		data: {
			firstPaymentConfirmed: true,
		},
	});
};
