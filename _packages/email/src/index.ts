import { renderAsync } from "@react-email/components"
import RecentLoginEmail from "../emails/RecentLogin"

export interface RecentLoginEmailProps {
    userFirstName?: string;
    loginDate?: Date;
    loginDevice?: string;
    loginLocation?: string;
    loginIp?: string;
    contactUrl?: string;
    locale?: string;
}

export const renderRecentLogin = async (opts: RecentLoginEmailProps, plainText: boolean | undefined) => {
    const emailHtml = await renderAsync(RecentLoginEmail({
        ...opts,
    }), {
        plainText: plainText,
    })
    return emailHtml
}