import { parseEnv, z } from "znv";

const CURRENCY_ISO = ["USD", "EUR", "GBP", "DKK", "SEK", "NOK"] as const;
export type Currency = typeof CURRENCY_ISO[number];

export const ENV = parseEnv(process.env, {
	NODE_ENV: z.enum(["development", "production"]).default("development"),
	PORT: z.number().default(3000),

	PROXMOX_HOST: z.string(),
	PROXMOX_USER: z.string(),
	PROXMOX_PASSWORD: z.string(),
	PROXMOX_NODE: z.string(),

	NO_VNC_URL: z.string().url(),

	SENTRY_DSN: z.string().optional(),

	REDIS_URL: z.string(),

	STRIPE_API_KEY: z.string().optional(),
	STRIPE_WEBHOOK_SECRET: z.string().optional(),

	COINBASE_API_KEY: z.string().optional(),
	COINBASE_WEBHOOK_SECRET: z.string().optional(),

	JWT_SECRET: z.string(),

	LOG_LEVEL: z
		.enum(["trace", "debug", "info", "warn", "error", "fatal"])
		.default("debug"),
	CURRENCY: z.enum(CURRENCY_ISO).default("USD"),
	BASE_URL: z.string(),

	VAT_PERCENTAGE: z.number().default(25),

	SMTP_HOST: z.string(),
	SMTP_PORT: z.number(),
	SMTP_USER: z.string().email(),
	SMTP_PASSWORD: z.string(),
	SMTP_FROM_NAME: z.string(),
	SMTP_FROM_EMAIL: z.string().email(),

	DINERO_CLIENT_ID: z.string().optional(),
	DINERO_CLIENT_SECRET: z.string().optional(),
	DINERO_API_KEY: z.string().optional(),
	DINERO_ORG_ID: z.string().optional(),
	DINERO_ACCOUNT_NUMBER: z.number().optional(),
	//DINERO_REFRESH_TOKEN: z.string().optional(),

	CLOUD_INIT_SNIPPETS_SERVER_HOST: z.string(),
	CLOUD_INIT_SNIPPETS_SERVER_USER: z.string(),
	CLOUD_INIT_SNIPPETS_SERVER_PASSWORD: z.string(),

	DATALIX_API_KEY: z.string().optional(),
	DATALIX_VM_IP_SERVICE_ID: z.string().optional(),

});
