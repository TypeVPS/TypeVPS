import nodemailer from "nodemailer"
import { ENV } from "../env"
import { pinoLogger } from "../log"
const logger = pinoLogger.child({ module: "mail" })

export const FROM_STR = `${ENV.SMTP_FROM_NAME} <${ENV.SMTP_FROM_EMAIL}>`
export const mailClient = nodemailer.createTransport({
	host: ENV.SMTP_HOST,
	port: ENV.SMTP_PORT,
	secure: ENV.SMTP_PORT === 465,
	auth: {
		user: ENV.SMTP_USER,
		pass: ENV.SMTP_PASSWORD,
	},
})
mailClient.on("error", (err) => {
	logger.error(err)
})