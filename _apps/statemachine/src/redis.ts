import { createClient } from "redis";
import { ENV } from "./env";

export const redisClient = createClient({
	url: ENV.REDIS_URL,
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient
	.connect()
	.then(() => console.log("Redis Client Connected"))
	.catch((err) => console.log("Redis Client Error", err));
