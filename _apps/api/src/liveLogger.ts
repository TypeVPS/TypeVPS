import { TRPCError } from "@trpc/server";

export interface LiveLogMessage {
	message: string;
	date: Date;
	status: "ok" | "error" | "warning" | "working";
}
export interface LiveLogs {
	messages: LiveLogMessage[];
	status: "failed" | "success" | "working";
	vmId?: string;
}

export const liveLogs = new Map<string, LiveLogs>();

export interface LiveLogger {
	log: (message: string, status?: LiveLogMessage["status"]) => void;
	success: (message: string) => void;
	fail: (message: string) => void;
	liveLogId: string;
	getAllLogs: () => LiveLogs | undefined;
}

export const createLiveLogger = (opts: {
	dbVmId?: string,
	type: string,
	logic?: (logger: LiveLogger) => Promise<void>
}) => {
	const randomId = Math.random().toString(36).substring(7)
	liveLogs.set(randomId, {
		messages: [],
		status: "working",
		vmId: opts.dbVmId,
	});

	const log = (
		message: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		status: LiveLogMessage["status"] = "working",
	) => {
		const logs = liveLogs.get(randomId);
		if (!logs) return;

		const lastLog = logs.messages[logs.messages.length - 1];
		if (lastLog?.status === "working") {
			lastLog.status = "ok";
		}

		logs.messages?.push({
			date: new Date(),
			message,
			status: "working",
		});

		console.log(`[${randomId}] live-logs: ${message}`)
	};

	const success = (message: string) => {
		const logs = liveLogs.get(randomId);
		if (!logs) return;

		log(message, "ok");

		logs.status = "success";
	};

	const fail = (message: string) => {
		const logs = liveLogs.get(randomId);
		if (!logs) return;

		log(message, "error");

		logs.status = "failed";
	};

	const getAllLogs = () => {
		return liveLogs.get(randomId);
	};

	// start logic catch errors
	const logger = {
		log,
		success,
		fail,
		liveLogId: randomId,
		getAllLogs
	} as LiveLogger

	if (opts.logic) {
		opts.logic(logger).catch((error) => {
			if (error instanceof TRPCError) {
				fail(`Error: ${error.message}`);

				if (error.code === "INTERNAL_SERVER_ERROR") {
					console.error(error);
				}
			} else {
				fail(`Unknown Error...`);
				console.error(error);
			}
		});
	}

	return logger;
};
