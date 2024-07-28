import axios from 'axios';
import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import { getAccessTicket, getVNCWebsocketConnection } from './proxmox';
import { ENV } from './env';

async function start() {
    // try to login to proxmox
    await getAccessTicket()

    // Create a new TextEncoder instance, which will be used to
    const textEncoder = new TextEncoder()
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    // Handle incoming WebSocket connections
    wss.on('connection', async (ws) => {
        const state = {
            isAuthorized: false,
        }

        // Handle messages received from the client
        ws.on('message', async (message) => {
            if (!state.isAuthorized) {
                try {
                    const parsedAuthMessage = JSON.parse(message.toString()) as {
                        vmId: string,
                        accessToken: string,
                    }

                    const apiResponse = await axios({
                        baseURL: ENV.BASE_URL,
                        url: '/api/vnc_proxy',
                        params: {
                            vmDbId: parsedAuthMessage.vmId,
                            accessToken: parsedAuthMessage.accessToken,
                        },
                        method: 'GET',
                    })
                    state.isAuthorized = true

                    const { proxmoxNode, proxmoxVmId } = apiResponse.data
                    const { wsUrl, authCookieDetails, vnc } = await getVNCWebsocketConnection(proxmoxNode, proxmoxVmId)

                    const sendMessage = JSON.stringify({
                        "password": vnc.password
                    })

                    ws.send(textEncoder.encode(sendMessage))

                    const proxiedWs = new WebSocket(wsUrl, {
                        rejectUnauthorized: false,
                        headers: authCookieDetails.headers
                    });

                    proxiedWs.on('open', () => {
                        console.log(`Connected to VNC WebSocket for VM`);
                    })

                    proxiedWs.on('message', (originalMessage) => {
                        ws.send(originalMessage);
                    });

                    ws.on('message', (message) => {
                        proxiedWs.send(message);
                    });
                } catch (error) {
                    console.log(error)
                    ws.close()
                }
            }
        });
    });

    // Serve static files from the "public" directory
    app.use(express.static('novnc'));

    // Start the server
    const PORT = process.env.PORT || 5003;
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

start().catch((error) => {
    console.error(error);
    process.exit(1);
})