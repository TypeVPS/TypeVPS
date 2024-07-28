import { z } from "zod";

const env = z.object({
	PROXMOX_HOST: z.string(),
	PROXMOX_USER: z.string(),
	PROXMOX_PASSWORD: z.string(),
	PROXMOX_NODE: z.string(),
    BASE_URL: z.string(),
    PROXMOX_ALLOW_UNAUTHORIZED: z.string().optional()
}).safeParse(process.env);
const DEV_MODE = process.env.NODE_ENV !== 'production';

if(!env.success) {
    console.error('Invalid environment variables!');
    console.error(env.error.errors);
    process.exit(1);
    throw new Error('Invalid environment variables!');
}

export const ENV = env.data;
if(!DEV_MODE) {
    // This is to avoid leaking sensitive information in production
    console.log('Running in production mode! disabling trace and debug logging!');
    console.trace = () => {};
    console.debug = () => {};
}
if(DEV_MODE) {
    console.warn('NODE_ENV development is set, disabling certificate validation!');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}