import axios from "axios";
import { z } from "zod";
import { ENV } from "./env";

const instance = axios.create({
    baseURL: ENV.PROXMOX_HOST,
});

export const getAccessTicket = async () => {
    const result = await instance.post(`/api2/json/access/ticket`, {
        username: ENV.PROXMOX_USER,
        password: ENV.PROXMOX_PASSWORD
    });
    const schema = z.object({
        data: z.object({
            CSRFPreventionToken: z.string(),
            ticket: z.string(),
        })
    })
    const parsedResult = schema.parse(result.data);

    console.debug(`Got proxmox ticket! CSRFPreventionToken: ${parsedResult.data.CSRFPreventionToken}, ticket: ${parsedResult.data.ticket}`);

    return parsedResult.data;
}

export const getVNCWebsocketConnection = async (node: string, vmid: string) => {
    console.debug(`Requesting VNC WebSocket for VM ${vmid} on node ${node}`);
    const accessTicket = await getAccessTicket();

    const authCookieDetails = {
        CSRFPreventionToken: accessTicket.CSRFPreventionToken,
        ticket: accessTicket.ticket,
        headers: {
            'CSRFPreventionToken': accessTicket.CSRFPreventionToken,
            'Cookie': `PVEAuthCookie=${accessTicket.ticket}`
        }
    }
    console.debug(`Got CSRFPreventionToken for VM ${vmid} on node ${node}! Getting vncproxy`);

    const vncproxyResult = await instance.post(`/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`, {
        websocket: 1,
        'generate-password': 1
    }, {
        headers: authCookieDetails.headers
    });

    console.debug(`vncproxy - port: ${vncproxyResult.data.data.port}, ticket: ${vncproxyResult.data.data.ticket}`);

    const vncticket = vncproxyResult.data.data.ticket;
    const vncport = vncproxyResult.data.data.port;

    const wsUrl = `${ENV.PROXMOX_HOST.replace('https://', 'wss://')}/api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket?port=${vncport}&vncticket=${encodeURIComponent(vncticket)}`

    console.debug(`Got vncproxy for VM ${vmid} on node ${node}! Connecting to ${wsUrl}`);
    return {
        wsUrl,
        authCookieDetails,
        vnc: {
            port: vncport,
            ticket: vncticket,
            password: vncproxyResult.data.data.password
        }
    }
}