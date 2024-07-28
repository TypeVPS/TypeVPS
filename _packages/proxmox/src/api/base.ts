/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";
import { ProxmoxIdOBJ, engine } from "../proxmoxApi";
import { AxiosRequestConfig } from "axios";

export async function qemuZodGet<T extends z.ZodType<any, any>,>(
	id: ProxmoxIdOBJ,
	path: string,
	zod: T,
	opts?: AxiosRequestConfig,
) {
	const url = `/nodes/${id.node}/qemu/${id.vmid}/${path}`;
	const { data, status, statusText } = await engine({
		method: "GET",
		url: url,
		...opts,
	});

	if (status !== 200)
		throw new Error(`${id.node}-${id.vmid} ${path} ${status} ${statusText}`);

	return zod.parse(data) as z.infer<T>;
}

export async function zodGet<T extends z.ZodType<any, any>,>(
	path: string,
	zod: T,
	opts?: AxiosRequestConfig,
) {
	const url = path;

	const { data, status,statusText } = await engine({
		method: "GET",
		url,
		...opts,
	});

	if (status !== 200) throw new Error(`${path} ${status} ${statusText}`);

	return zod.parse(data) as z.infer<T>;
}
