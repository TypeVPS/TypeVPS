import { PaymentStatus, SubscriptionStatus } from "@typevps/db";
import dayjs from "dayjs";
import { FastifyInstance } from "fastify";
import stripe from "stripe";
import {
	CancelSubscriptionInput,
	GeneralInput,
	GeneralOutput,
	PaymentProvider,
	UpdateSubscriptionNextBillingDateInput,
	UpdateSubscriptionPriceInput,
	updatePaymentStatus,
	updateSubscriptionStatus,
} from "..";
import { prismaClient } from "@/db";
import { ENV } from "../../env";
import { pinoLogger } from "../../log";
const logger = pinoLogger.child({ module: "stripe" });

const isEnabled = !!ENV.STRIPE_API_KEY && !!ENV.STRIPE_WEBHOOK_SECRET;
const supportsSubscriptions = true;
if (!isEnabled) {
	logger.warn(
		"Missing STRIPE_API_KEY or STRIPE_WEBHOOK_SECRET, disabling stripe payment provider",
	);
}

const stripeClient = new stripe.Stripe(ENV?.STRIPE_API_KEY ?? "", {
	apiVersion: "2022-11-15",
});

// create payment link
const createPayment = async (input: GeneralInput): Promise<GeneralOutput> => {
	logger.trace("creating stripe payment session", input);

	const paymentSession = await stripeClient.checkout.sessions.create({
		success_url: input.returnUrl,
		payment_method_types: ["card"],
		line_items: input.products.map((product) => ({
			price_data: {
				currency: ENV.CURRENCY,
				product_data: {
					name: product.name,
				},
				unit_amount: product.price * 100,
				tax_behavior: 'inclusive'
			},
			quantity: 1,
		})),
		automatic_tax: {
			enabled: ENV.NODE_ENV === "production",
		},
		customer_email: input.customerEmail,
		mode: "payment",
		expires_at: dayjs().add(1, "hour").unix(),
	});
	logger.trace(
		"created stripe payment session",
		JSON.stringify(paymentSession),
	);
	logger.info(`created stripe payment session ${paymentSession.id}`);

	if (!paymentSession.url) {
		throw new Error("Stripe payment session did not return a url");
	}

	return {
		provider: "STRIPE",
		providerPaymentId: paymentSession.id,
		providerPaymentUrl: paymentSession.url,
	};
};

const createSubscription = async (
	input: GeneralInput,
): Promise<GeneralOutput> => {
	logger.info(`creating stripe subscription session ${input.customerEmail}`);

	const params: stripe.Checkout.SessionCreateParams = {
		success_url: input.returnUrl,
		payment_method_types: ["card"],
		line_items: input.products.map((product) => ({
			price_data: {
				currency: ENV.CURRENCY,
				product_data: {
					name: product.name,
				},
				unit_amount: product.price * 100,
				recurring: {
					interval: "month",
					interval_count: 1,
				},
				tax_behavior: 'inclusive'
			},
			quantity: 1,
		})),
		automatic_tax: {
			enabled: ENV.NODE_ENV === "production",
		},
		mode: "subscription",
		expires_at: dayjs().add(1, "hour").unix(),
		customer_email: input.customerEmail,
	};

	if (input.startAt) {
		params.subscription_data = {
			trial_end: Math.floor(input.startAt.getTime() / 1000),
		};
	}

	const paymentSession = await stripeClient.checkout.sessions.create(params);

	if (!paymentSession.url) {
		throw new Error("Stripe payment session did not return a url");
	}

	return {
		provider: "STRIPE",
		providerPaymentId: paymentSession.id,
		providerPaymentUrl: paymentSession.url,
	};
};

const handleSubscriptionDeleted = async (event: stripe.Event) => {
	const subscription = event.data.object as stripe.Subscription;

	await updateSubscriptionStatus({
		status: "CANCELLED",
		cancelledAt: new Date((subscription.canceled_at ?? 0) * 1000),
		paymentProviderSubscriptionId: subscription.id,
	});

	logger.info(`subscription deleted ${subscription.id}`);
};

const handleSubscriptionUpdated = async (event: stripe.Event) => {
	const subscription = event.data.object as stripe.Subscription;

	// make a map of stripe statuses to our statuses
	const statusMap: Record<stripe.Subscription.Status, SubscriptionStatus> = {
		active: "ACTIVE",
		canceled: "CANCELLED",
		incomplete: "PENDING",
		incomplete_expired: "PENDING_EXPIRED",
		past_due: "CANCELLED",
		trialing: "ACTIVE_TRAILING",
		unpaid: "CANCELLED",
		paused: "CANCELLED",
	};
	const status = statusMap[subscription.status];

	await updateSubscriptionStatus({
		status,
		cancelledAt: subscription.canceled_at
			? new Date(subscription.canceled_at * 1000)
			: undefined,
		paymentProviderSubscriptionId: subscription.id,
		expiresAt: new Date(subscription.current_period_end * 1000),
	});
};

const handleSessionCompleted = async (event: stripe.Event) => {
	const session = event.data.object as stripe.Checkout.Session;
	const subscriptionId = session.subscription as string;
	if (subscriptionId) {
		// set subscription id
		await prismaClient.subscription.update({
			where: {
				paymentProviderId: session.id,
			},
			data: {
				paymentProviderSubscriptionId: subscriptionId,
			},
		});

		logger.info(`subscription created ${subscriptionId}`);
	} else {
		const statusMap: {
			[key in stripe.Checkout.Session.Status]: PaymentStatus;
		} = {
			complete: "COMPLETED",
			expired: "PENDING_EXPIRED",
			open: "PENDING",
		};

		await updatePaymentStatus({
			status: statusMap[session?.status ?? "open"],
			paymentProviderId: session.id,
		});

		logger.info(`payment completed ${session.id}`);
	}
};

const webhook = async (app: FastifyInstance) => {
	// stripe webhook using fastify
	// use raw body parser

	await app.register((fastify, opts, done) => {
		fastify.addContentTypeParser(
			"application/json",
			{ parseAs: "buffer" },
			function (_req, body, done) {
				done(null, body);
			},
		);
		fastify.post("/stripewebhook", async (req) => {
			if (!ENV.STRIPE_WEBHOOK_SECRET) {
				throw new Error("Stripe webhook secret not set");
			}

			const body: string | Buffer = req.body as string | Buffer
			const signature = req.headers["stripe-signature"] as string;

			const event = stripeClient.webhooks.constructEvent(
				body,
				signature,
				ENV.STRIPE_WEBHOOK_SECRET,
			);

			if (event.type === "checkout.session.completed") {
				await handleSessionCompleted(event);
			}

			if (event.type === "customer.subscription.deleted") {
				await handleSubscriptionDeleted(event);
			}

			if (event.type === "customer.subscription.updated") {
				// wait 500ms to avoid data race
				await new Promise((resolve) => setTimeout(resolve, 500));

				await handleSubscriptionUpdated(event);
			}

			if (event.type === "customer.subscription.created") {
				await new Promise((resolve) => setTimeout(resolve, 500));
				await handleSubscriptionUpdated(event);
			}
		});
		done();
	});

	return void 0;
};

const cancelSubscription = async (
	input: CancelSubscriptionInput,
): Promise<void> => {
	const subscription = await stripeClient.subscriptions.retrieve(
		input.paymentProviderSubscriptionId,
	);
	await stripeClient.subscriptions.cancel(subscription.id);
};

const updateSubscriptionPrice = async (input: UpdateSubscriptionPriceInput) => {
	const subscription = await stripeClient.subscriptions.retrieve(
		input.paymentProviderSubscriptionId,
	);
	if (!subscription) {
		throw new Error("No subscription found");
	}

	const subscriptionItem = subscription.items.data[0];
	const priceOptions = subscriptionItem.price;
	const productId = priceOptions.product;
	if (typeof productId !== "string") {
		throw new Error("No product id found");
	}

	if (!priceOptions.recurring) {
		throw new Error("No recurring price options found");
	}

	await stripeClient.subscriptionItems.update(subscriptionItem.id, {
		price_data: {
			product: productId,
			currency: ENV.CURRENCY,
			recurring: priceOptions.recurring,
			unit_amount: input.newPrice * 100,
		},
	});

	return;
};

const updateSubscriptionNextBillingDate = async (
	input: UpdateSubscriptionNextBillingDateInput,
) => {
	const subscription = await stripeClient.subscriptions.retrieve(
		input.paymentProviderSubscriptionId,
	);
	if (!subscription) {
		throw new Error("No subscription found");
	}

	const subscriptionItem = subscription.items.data[0];
	const priceOptions = subscriptionItem.price;
	const productId = priceOptions.product;
	if (typeof productId !== "string") {
		throw new Error("No product id found");
	}

	if (!priceOptions.recurring) {
		throw new Error("No recurring price options found");
	}

	await stripeClient.subscriptions.update(subscriptionItem.id, {
		pause_collection: {
			behavior: "void",
			resumes_at: input.nextBillingDate.getTime() / 1000,
		},
	});

	return;
};

export default {
	payment: {
		create: createPayment,
	},
	subscription: {
		create: createSubscription,
		cancel: cancelSubscription,
		updatePrice: updateSubscriptionPrice,
		updateNextBillingDate: updateSubscriptionNextBillingDate,
	},
	webhook,
	isEnabled,
	supportsSubscriptions,
	type: "card",
} as PaymentProvider;
