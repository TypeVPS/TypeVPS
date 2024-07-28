import { z } from "zod"
import { ENV } from "../../env"
import axios from "axios"
import { prismaClient } from "@/db"

/* const BASE_URL = 'https://api.dinero.dk'
const AUTH_URL = 'https://connect.visma.com/connect/authorize' */
const ACCESS_TOKEN_URL = 'https://connect.visma.com/connect/token'
const REDIRECT_URL = `${ENV.BASE_URL}/api/trpc/dinero.callback`

if (!ENV.DINERO_CLIENT_ID || !ENV.DINERO_CLIENT_SECRET) {
    throw new Error('DINERO_CLIENT_ID or DINERO_CLIENT_SECRET not defined')
}

export function generateRedirectUrl(): string {
    const baseUrl = 'https://connect.visma.com/consent';

    if (!ENV.DINERO_CLIENT_ID) {
        throw new Error('DINERO_CLIENT_ID not defined')
    }

    const returnUrl = '/connect/authorize/callback';
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: ENV.DINERO_CLIENT_ID,
        scope: 'dineropublicapi:read dineropublicapi:write offline_access',
        redirect_uri: REDIRECT_URL,
    }).toString();

    const completeReturnUrl = `${returnUrl}?${params}`;
    const encodedReturnUrl = encodeURIComponent(completeReturnUrl);

    return `${baseUrl}?returnUrl=${encodedReturnUrl}`;
}


export const exchangeCodeForTokenSchema = z.object({
    code: z.string(),
    scope: z.string(),
    iss: z.string(),
})

const oauthOutSchema = z.object({
    access_token: z.string(),
    expires_in: z.number(),
    refresh_token: z.string(),
    scope: z.string(),
})

type ExchangeCodeForTokenSchema = z.infer<typeof exchangeCodeForTokenSchema>
export const exchangeCodeForToken = async (d: ExchangeCodeForTokenSchema) => {
    const tokenResponse = await axios.post(ACCESS_TOKEN_URL, {
        grant_type: 'authorization_code',
        client_id: ENV.DINERO_CLIENT_ID as string,
        client_secret: ENV.DINERO_CLIENT_SECRET as string,
        redirect_uri: REDIRECT_URL,
        code: d.code,
        scope: d.scope,
        iss: d.iss,

    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });

    const parsed = oauthOutSchema.parse(tokenResponse.data)

    await updateCredentials(parsed)

    return parsed
}

let CURRENT_AUTH_DATA: {
    access_token: string
    expires_at: Date
    refresh_token: string
} | undefined = undefined

const updateCredentials = async (credentials: z.infer<typeof oauthOutSchema>) => {
    await prismaClient.dineroApi.create({
        data: {
            accessToken: credentials.access_token,
            expiresAt: new Date(Date.now() + credentials.expires_in * 1000),
            refreshToken: credentials.refresh_token,
        },
    })

    CURRENT_AUTH_DATA = {
        access_token: credentials.access_token,
        expires_at: new Date(Date.now() + credentials.expires_in * 1000),
        refresh_token: credentials.refresh_token,
    }

}

export const refreshAccessToken = async () => {
    if (!CURRENT_AUTH_DATA?.refresh_token) {
        const dbData = await prismaClient.dineroApi.findFirst({
            where: {},
            orderBy: {
                createdAt: 'desc',
            }
        })

        if (!dbData) {
            throw new Error('No dinero credentials found')
        }

        CURRENT_AUTH_DATA = {
            access_token: dbData.accessToken,
            expires_at: dbData.expiresAt,
            refresh_token: dbData.refreshToken,
        }
    }

    const tokenResponse = await axios.post(ACCESS_TOKEN_URL, {
        grant_type: 'refresh_token',
        client_id: ENV.DINERO_CLIENT_ID as string,
        client_secret: ENV.DINERO_CLIENT_SECRET as string,
        refresh_token: CURRENT_AUTH_DATA?.refresh_token
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    })

    const parsed = oauthOutSchema.parse(tokenResponse.data)
    await updateCredentials(parsed)
}


export const getAccessToken = async () => {
    if (!CURRENT_AUTH_DATA || CURRENT_AUTH_DATA.expires_at.getTime() < Date.now()) {
        console.log('no current auth data or expired, refreshing')
        await refreshAccessToken()
    }

    if (!CURRENT_AUTH_DATA?.access_token) {
        throw new Error('CURRENT_AUTH_DATA?.access_token not defined')
    }

    return CURRENT_AUTH_DATA?.access_token
}