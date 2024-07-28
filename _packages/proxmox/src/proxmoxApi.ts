import axios from "axios";
import dayjs from "dayjs";
import agent from "./api/agent";
import qemu from "./api/qemu";
import cluster from "./api/cluster";
import storage from "./api/storage";

const ENV = {
	PROXMOX_HOST: process.env.PROXMOX_HOST || "https://proxmox",
	PROXMOX_USER: process.env.PROXMOX_USER || "root@pam",
	PROXMOX_PASSWORD: process.env.PROXMOX_PASSWORD || "password",
	NODE_ENV: process.env.NODE_ENV || "development",
}


const logger = {
	info: console.log,
	warn: console.warn,
	error: console.error,
};

if (ENV.NODE_ENV === "development") {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	logger.warn("----------------- DEVELOPMENT MODE ------------------");
	logger.warn("DISABLING CERTIFICATE CHECKS");
	logger.warn("----------------- DEVELOPMENT MODE ------------------");
}

export type ProxmoxIdOBJ = {
	node: string;
	vmid: number;
};

export const engine = axios.create({
	baseURL: `${ENV.PROXMOX_HOST}/api2/json`,
});

engine.interceptors.response.use(
	(response) => response,
	(error) => {
		return Promise.resolve(error.response);
	},
);
engine.interceptors.request.use(async (request) => {
	if (request.url === "/access/ticket") {
		return request;
	}

	if (dayjs(lastLoggedInAt).add(1, "hour").isBefore(dayjs())) {
		logger.info(
			`Re-logging into Proxmox API ${ENV.PROXMOX_HOST} as ${ENV.PROXMOX_USER}`,
		);
		await login();
	}

	return request;
});

const lastLoggedInAt = new Date(0);
export const login = async () => {
	logger.info(
		`Logging into Proxmox API ${ENV.PROXMOX_HOST} as ${ENV.PROXMOX_USER}`,
	);
	const req = await engine({
		method: "POST",
		url: "/access/ticket",
		data: {
			username: ENV.PROXMOX_USER,
			password: ENV.PROXMOX_PASSWORD,
		},
	});

	const authDetails = req?.data?.data as
		| {
			CSRFPreventionToken?: string;
			ticket?: string;
			username?: string;
		}
		| undefined;

	if (!authDetails || !authDetails.ticket || !authDetails.CSRFPreventionToken) {
		logger.error(
			`Failed to login to Proxmox API ${ENV.PROXMOX_HOST} as ${ENV.PROXMOX_USER}`,
		);
		throw new Error("Failed to login to Proxmox API");
	}

	logger.info(
		`Logged into Proxmox API ${ENV.PROXMOX_HOST} as ${ENV.PROXMOX_USER}`,
	);

	engine.defaults.headers["common"][
		"Cookie"
	] = `PVEAuthCookie=${authDetails.ticket};`;
	engine.defaults.headers["common"]["CSRFPreventionToken"] =
		authDetails.CSRFPreventionToken;
	lastLoggedInAt.setTime(new Date().getTime());

	// checking if we can pull resources
};

export default {
	login, agent, qemu, cluster, storage,
	setAuthCredentials: (
		opts: {
			proxmoxHost: string;
			proxmoxUser: string;
			proxmoxPassword: string;
		}
	) => {
		ENV.PROXMOX_HOST = opts.proxmoxHost;
		ENV.PROXMOX_USER = opts.proxmoxUser;
		ENV.PROXMOX_PASSWORD = opts.proxmoxPassword;
	}
};
