import { createClient } from "redis";
import { ENV } from "./env";

export const _redisClient = createClient({
	url: ENV.REDIS_URL,
});
export const redisClient = _redisClient.duplicate();


const connectClient = (client: typeof redisClient) => {
	client.on("error", (err) => console.log("Redis Client Error", err));
	client
		.connect()
		.then(() => console.log("Redis Client Connected"))
		.catch((err) => console.log("Redis Client Error", err));
}

connectClient(redisClient);
connectClient(_redisClient);