import pino from "pino"
import { ENV } from "./env"


export const pinoLogger = pino({
	level: ENV.LOG_LEVEL,
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
			// ignore pid
			ignore: "pid,hostname,module",
		},
	},
})
