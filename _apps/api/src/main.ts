import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import ws from "@fastify/websocket";
import "@total-typescript/ts-reset";
import { TRPCError } from "@trpc/server";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { proxmoxApi } from "@typevps/proxmox";
import fastify, { FastifyRequest } from "fastify";
import { Context, createContext } from "./context";
import { prismaClient } from "./db";
import { ENV } from "./env";
import { pinoLogger } from "./log";
import './mail';
import { mailClient } from "./mail";
import { PAYMENT_PROVIDERS } from "./payments/providers";
import { appRouter } from "./router/tt";
//import api, { ORG_ID, dineroApiClient } from "./dinero/api";
import * as Sentry from "@sentry/node";
import { z } from "zod";
import { __getVmEnsureAccess, getVmEnsureAccess } from "./router/vms/utils";
import { validateJwt } from "./router/auth";
import { getVMState } from "./proxmox";

const logger = pinoLogger.child({ module: "main" });
async function main() {
	if (ENV.NODE_ENV === 'production' && !ENV.SENTRY_DSN) {
		throw new Error("SENTRY_DSN is required in production mode");
	}
	if (ENV.SENTRY_DSN) {
		Sentry.init({
			dsn: ENV.SENTRY_DSN,
			tracesSampleRate: 1.0,
		});
	}

	// connect to db
	await prismaClient.$connect().catch((err) => {
		logger.error("Could not connect to database");
		console.error(err);
		process.exit(1);
	});

	// verify email smtp connection
	await mailClient.verify()
	logger.info(
		`SMTP connection established to "${ENV.SMTP_HOST}" on port ${ENV.SMTP_PORT}`,
	)


	const app = fastify({ maxParamLength: 5000 });
	await app.register(ws);
	await app.register(cookie, {
		hook: "onRequest",
		parseOptions: {},
	});

	// register payment provider webhooks
	for (const [name, paymentProvider] of Object.entries(PAYMENT_PROVIDERS)) {
		if (paymentProvider.isEnabled && paymentProvider.webhook) {
			await paymentProvider.webhook(app);
			logger.info(`Registered webhook for ${name}`);
		}
	}

	// catch all errors
	app.setErrorHandler(async (error, request, reply) => {
		logger.error(error);
		await reply.send(error);
	});

	if (ENV.NODE_ENV === "development") {
		logger.warn("----------------- DEVELOPMENT MODE ------------------");
		logger.warn("ADDING DELAY TO REQUESTS TO SIMULATE NETWORK LATENCY");
		logger.warn("----------------- DEVELOPMENT MODE ------------------");

		/* 		app.addHook("onRequest", async (req, reply) => {
			await new Promise((resolve) => setTimeout(resolve, 250));
		}); */
	}
	await app.register(cors, { origin: "*" });
	await app.register(fastifyTRPCPlugin, {
		prefix: "/trpc",
		trpcOptions: {
			router: appRouter,
			createContext: createContext,
			onError: (err: {
				error: TRPCError; // the original error
				type: "query" | "mutation" | "subscription" | "unknown";
				path: string | undefined; // path of the procedure that was triggered
				input: unknown;
				ctx: Context | undefined;
				req: FastifyRequest;
			}) => {
				const { error } = err;
				if (!error || error.code === "INTERNAL_SERVER_ERROR") {
					logger.error(err.error.stack);

					if (ENV.SENTRY_DSN) {
						Sentry.withScope((scope) => {
							scope.setExtra("req", {
								url: err.req.url,
								method: err.req.method,
								headers: err.req.headers,
								body: err.req.body,
							})

							// capture error
							Sentry.captureException(err.error.stack)
						})
					}
				}

				if (ENV.NODE_ENV === "development") {
					console.log(err);
				}

				return err;
			},
		},
		useWSS: true,
	});

	app.get('/vnc_proxy', async (req, reply) => {
		const schema = z.object({
			vmDbId: z.string(),
			accessToken: z.string(),
		})
		const { vmDbId, accessToken } = schema.parse(req.query);

		console.log(`vnc_proxy: ${vmDbId} ${accessToken}`)

		// validate jwt
		const user = await validateJwt(accessToken)

		// get vm
		const vm = await __getVmEnsureAccess(vmDbId, user, 'console')

		// get vm state
		const vmState = await getVMState(vm.id)
		if(!vmState) {
			throw new Error('VM not found or not running')
		}

		return {
			proxmoxNode: vmState.node,
			proxmoxVmId: vmState.vmid,
		}

	})

	app.listen(
		{
			port: 5001,
			host: '0.0.0.0'
		},
		(err, address) => {
			if (err) {
				console.error(err);
				process.exit(1);
			}

			logger.info(`Server listening on ${address}`);
		},
	);

	// add graceful shutdown, also for ts-node-dev restarts
	process.on("SIGINT", () => {
		console.log("shutdown");
		app.close().catch(() => {
			process.exit(0);
		});
	});

	await proxmoxApi.login();

	setInterval(() => {
		console.log('trying to fetch login...')
		proxmoxApi.login().then(()=>console.log('success? on login refetch')).catch((err) => {
			console.log(err, 'failed refetching login?')
		})
	}, 60_000 * 60)
}
main().catch((err) => {
	console.error(err);
	process.exit(1);
});

