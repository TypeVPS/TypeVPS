import type { RecentLoginEmailProps } from "@typevps/email"
import { renderRecentLogin } from "@typevps/email"
import { FROM_STR, mailClient } from "."
import { pinoLogger } from "../log"
const logger = pinoLogger.child({ module: "reset-password" })

export const sendRecentLoginEmail = async (email: string, input: RecentLoginEmailProps) => {
	logger.info(`Sending recent login email to ${email}`)

	const html = await renderRecentLogin(input, false)
	const plainText = await renderRecentLogin(input, true)
	await mailClient.sendMail({
		to: email,
		from: FROM_STR,
		subject: "TypeVPS | Login notification",
		text: plainText,
		html,
	})
}