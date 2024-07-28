import { FROM_STR, mailClient } from "."
import { ENV } from "../env"
import { pinoLogger } from "../log"
const logger = pinoLogger.child({ module: "reset-password" })

export const sendPasswordResetEmail = async (input: {
	email: string
	token: string
}) => {
	logger.info(`Sending password reset email to ${input.email}`)

	await mailClient.sendMail({
		to: input.email,
		from: FROM_STR,
		subject: "Password reset",
		text: "Password reset",
		html: passwordResetTemplate(input.token),
	})
}

const passwordResetTemplate = (token: string) => {
	const uri = `${ENV.BASE_URL}/auth/reset-password?token=${token}`

	return `
<div>
	<p>Click the link below to reset your password</p>
	<a href="${uri}">Reset password</a>
</div>
`
}
