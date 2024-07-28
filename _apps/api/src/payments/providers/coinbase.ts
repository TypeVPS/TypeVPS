import { FastifyInstance } from "fastify";
import {
	GeneralInput,
	GeneralOutput,
	PaymentProvider,
	updatePaymentStatus,
} from "..";
import * as coinbase from "coinbase-commerce-node";
import { ENV } from "../../env";

const isEnabled = !!ENV.COINBASE_API_KEY && !!ENV.COINBASE_WEBHOOK_SECRET;
const supportsSubscriptions = false;

// typescript is dumb, and cannot infer isEnabled
if (ENV.COINBASE_API_KEY && ENV.COINBASE_WEBHOOK_SECRET) {
	coinbase.Client.init(ENV.COINBASE_API_KEY);
}

const createPayment = async (input: GeneralInput): Promise<GeneralOutput> => {
	const charge = await coinbase.resources.Charge.create({
		description: input.products.map((p) => p.description).join("\n"),
		local_price: {
			amount: input.totalPrice.toString(),
			currency: "USD",
		},
		name: input.products.map((p) => p.name).join(", "),
		pricing_type: "fixed_price",
		redirect_url: input.returnUrl,
	});

	return {
		providerPaymentId: charge.id,
		providerPaymentUrl: `https://commerce.coinbase.com/charges/${charge.code}`,
		provider: "COINBASE_COMMERCE",
	};
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

		fastify.post("/coinbasewebhook", async (req, reply) => {
			if (!ENV.COINBASE_WEBHOOK_SECRET) {
				throw new Error("Coinbase webhook secret not set");
			}

			const signature = req.headers["x-cc-webhook-signature"];
			if (!signature || typeof signature !== "string") {
				throw new Error("Missing Coinbase webhook signature");
			}

			const body = req.body as string;

			const event = coinbase.Webhook.verifyEventBody(
				body,
				signature,
				ENV.COINBASE_WEBHOOK_SECRET,
			);

			if (event.type === "charge:confirmed") {
				await updatePaymentStatus({
					status: "COMPLETED",
					paymentProviderId: event.data.id,
				});
			}

			if (event.type === "charge:failed") {
				await updatePaymentStatus({
					status: "FAILED",
					paymentProviderId: event.data.id,
				});
			}

			await reply.send({ received: true });
		});
		done();
	});
};

export default {
	payment: {
		create: createPayment,
	},
	webhook,
	isEnabled,
	supportsSubscriptions,
	type: "crypto",
} as PaymentProvider;
