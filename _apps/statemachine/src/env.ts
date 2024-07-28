import { parseEnv, z } from "znv";

const CURRENCY_ISO = ["USD", "EUR", "GBP", "DKK", "SEK", "NOK"] as const;
export type Currency = typeof CURRENCY_ISO[number];

export const ENV = parseEnv(process.env, {
	REDIS_URL: z.string(),
});
