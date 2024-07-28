import { createForm } from "@felte/solid"
import { validator } from "@felte/validator-zod"
import {
	Link,
	Route,
	Routes,
	useLocation,
	useNavigate,
	useSearchParams
} from "@solidjs/router"
import { Box, Button, FormControlLabel, FormLabel, Stack, Switch, TextField, Typography } from "@suid/material"
import { JSX, createMemo, onMount } from "solid-js"
import { z } from "zod"
import { ErrorLabel } from "@/components/ErrorLabel"
import { LoadingButton } from "@/components/LoadingButton"
import { Logo } from "@/components/Logo"
import auth, { useRedirectWhenLoggedIn } from "@/context/auth"
import lang from "@/lang"
import { trpc } from "@/trpc"
import { createDebounce } from "../utils"
import { FormTextField } from "@/components/form/FormTextField"
import { PasswordInput } from "@/components/PasswordWithGenerate"

const CenteredContainer = (props: {
	children: JSX.Element | JSX.Element[]
}) => {
	return (
		<div
			style={{
				width: "100%",
				display: "flex",
				"flex-direction": "row",
				"justify-content": "center",
				"align-items": "center",
				height: "calc(100vh - 160px)",
			}}
		>
			{props.children}
		</div>
	)
}

const FormContainer = (props: {
	children: JSX.Element | JSX.Element[]
	ref: HTMLFormElement | ((el: HTMLFormElement) => void) | undefined
}) => {
	return (
		<form ref={props.ref}>
			<Box
				sx={{
					maxWidth: "500px",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					padding: "12px",
					px: 2,
					py: 4,
					borderRadius: 2,
					gap: 2,
				}}
			>
				{props.children}
			</Box>
		</form>
	)
}

const EmailStep = () => {
	const navigate = useNavigate()
	const location = useLocation<{
		redirect?: string
	}>()
	const [searchParams] = useSearchParams<{
		redirect?: string
	}>()

	// this is for password managers to instantly fill in
	const loginMutation = trpc.auth.login.useMutation({
		onSuccess: () => {
			auth.updateJwtFromCookie()
		},
	})
	const schema = z.object({
		email: z.string().email().min(1),
		password: z.string().optional(),
	})
	type Schema = z.infer<typeof schema>
	const form = createForm<Schema>({
		extend: [validator({ schema, level: "error" })],
		onSubmit: (values) => {
			if (getUserByEmailMutation.isLoading || !getUserByEmailMutation.isSuccess) return

			if (values.password) {
				loginMutation.mutate({
					email: values.email,
					password: values.password,
				})
				return
			}

			// does the user exist?
			if (getUserByEmailMutation.data) {
				navigate("/auth/existing", {
					state: {
						email: values.email,
						redirect: location.state?.redirect ?? searchParams.redirect,
					},
				})
				return
			}

			// redirect to /auth/new
			navigate("/auth/new", {
				state: {
					email: values.email,
					redirect: location.state?.redirect ?? searchParams.redirect,
				},
			})
		},
	})
	const email = createMemo(() => form.data("email"))
	const emailDebounced = createDebounce(email, 1000)
	const emailChangedNotDebounced = createMemo(
		() => email() !== emailDebounced(),
	)
	const getUserByEmailMutation = trpc.auth.getUserByEmail.useQuery(() => {
		return {
			email: emailDebounced() ?? "",
		}
	})

	return (
		<CenteredContainer>
			<FormContainer ref={form.form}>
				<Stack direction="column" alignItems="center">
					<Logo
						style={{
							width: "40%",
							"aspect-ratio": "1/1",
							margin: "auto",
						}}
					/>
					<Typography variant="h4">{lang.t.productName()}</Typography>
					<Typography variant="body1">
						{lang.t.auth.emailStepTitle()}
					</Typography>
				</Stack>
				<TextField name="email" autoComplete="email" label="Email" />
				<ErrorLabel errors={form.errors("email")} />

				<input
					type="password"
					autocomplete="password"
					name="password"
					style={{
						position: "absolute",
						left: "-9999px",
						top: "-9999px",
					}}
				/>

				<LoadingButton
					variant="contained"
					type="submit"
					loading={
						getUserByEmailMutation.isLoading || emailChangedNotDebounced()
					}
				>
					{form.errors("email") && lang.t.auth.invalidEmail()}

					{!form.errors("email") &&
						getUserByEmailMutation.data?.id &&
						lang.t.auth.continueExistingUser()}

					{!form.errors("email") &&
						!getUserByEmailMutation.data?.id &&
						lang.t.auth.continueNewUser()}
				</LoadingButton>
				{/* 				<Divider>Sign in using</Divider>
				<SocialLogin /> */}
			</FormContainer>
		</CenteredContainer>
	)
}

const NewUserStep = () => {
	const navigate = useNavigate()
	const location = useLocation<{
		email: string
		redirect?: string
	}>()

	const registerMutation = trpc.auth.register.useMutation({
		onSuccess: () => {
			auth.updateJwtFromCookie()
		},
	})

	const schema = z.object({
		email: z.string().email().min(1),
		password: z.string().min(6).max(64),
		fullName: z.string().min(1).max(64),
		acceptedPrivacyAndTos: z.boolean().refine((v) => v === true, { message: 'You must accept the privacy policy and terms of service' })
	})
	type Schema = z.infer<typeof schema>
	const form = createForm<Schema>({
		extend: [validator({ schema, level: "error" })],
		onSubmit: (values) => {
			registerMutation.mutate(values)
		},
	})

	onMount(() => {
		if (!location.state?.email) {
			navigate("/auth", {
				state: {
					redirect: location.state?.redirect,
				},
			})
		}

		form.setData({
			email: location.state?.email || "",
			password: "",
			fullName: "",
			acceptedPrivacyAndTos: false
		})
	})

	return (
		<CenteredContainer>
			<FormContainer ref={form.form}>
				<Stack direction="column" alignItems="center">
					<Logo
						style={{
							width: "40%",
							"aspect-ratio": "1/1",
							margin: "auto",
						}}
					/>
					<Typography variant="h5">{lang.t.productName()}</Typography>
					<Typography variant="body1">{lang.t.auth.createNewAccount()}</Typography>
				</Stack>

				<FormTextField name="email" label={lang.t.auth.email()} disabled form={form} />

				<PasswordInput name="password" label={lang.t.auth.password()} />
				<ErrorLabel errors={form.errors("password")} />

				<FormTextField name="fullName" label={lang.t.fullName()} form={form} />


				<Stack>
					<FormControlLabel
						control={<Switch name="acceptedPrivacyAndTos" />}
						label={<>
							{lang.t.auth.iAccept()}
							<Link href="/privacy" style={{ color: 'rgba(70,70,250)' }}> {lang.t.auth.privacyPolicy()} </Link>
							{lang.t.and()}
							<Link href="/tos" style={{ color: 'rgba(70,70,250)' }}> {lang.t.auth.termsOfService()}</Link>
						</>}
					/>

				</Stack>

				<LoadingButton
					variant="contained"
					type="submit"
					loading={registerMutation.isLoading}
				>
					{lang.t.auth.createAccount()}
				</LoadingButton>
				<ErrorLabel errors={registerMutation.error?.message || form.errors()} />
			</FormContainer>
		</CenteredContainer>
	)
}

const RequestPasswordResetButton = (props: {
	email: string
}) => {
	const passwordResetMutation = trpc.auth.requestPasswordReset.useMutation()

	const statusMap = createMemo(() => {
		const map = {
			idle: {
				text: lang.t.auth.forgotPassword(),
				color: 'primary',
				variant: 'text'
			},
			loading: {
				text: lang.t.auth.sendingEmail(),
				color: 'primary',
				variant: 'outlined'
			},
			success: {
				text: lang.t.auth.sentCheckYourEmail(),
				color: 'success',
				variant: 'contained'
			},
			error: {
				text: 'error...',
				color: 'error',
				variant: 'contained'
			}
		} as const

		return map[passwordResetMutation.status]
	})

	return (
		<>
			<Button
				size="small"
				color={statusMap().color}
				variant={statusMap().variant}
				onClick={() => {
					passwordResetMutation.mutate({ email: props.email })
				}}
			>
				{statusMap().text}
			</Button>
		</>
	)
}

const ExistingUserStep = () => {
	const navigate = useNavigate()
	const location = useLocation<{
		email: string
	}>()

	const loginMutation = trpc.auth.login.useMutation({
		onSuccess: () => {
			auth.updateJwtFromCookie()
		},
	})

	const schema = z.object({
		email: z.string().email().min(1),
		password: z.string().min(6).max(64),
	})
	type Schema = z.infer<typeof schema>
	const form = createForm<Schema>({
		extend: [validator({ schema, level: "error" })],
		onSubmit: (values) => {
			loginMutation.mutate(values)
		},
	})

	onMount(() => {
		if (!location.state?.email) {
			navigate("/auth")
		}

		form.setData({
			email: location.state?.email || "",
			password: "",
		})
	})

	return (
		<CenteredContainer>
			<FormContainer ref={form.form}>
				<Stack direction="column" alignItems="center">
					<Logo
						style={{
							width: "40%",
							"aspect-ratio": "1/1",
							margin: "auto",
						}}
					/>
					<Typography variant="h5">{lang.t.productName()}</Typography>

					<Typography variant="body1">
						{lang.t.auth.loginStepTitle()}
					</Typography>
				</Stack>

				<input
					style={{ display: "none" }}
					type="email"
					name="email"
					autocomplete="email"
					value={form.data("email")}
				/>

				<PasswordInput name="password" label={lang.t.auth.password()} />
				<ErrorLabel errors={form.errors("password")} />

				<LoadingButton
					variant="contained"
					type="submit"
					loading={loginMutation.isLoading}
				>
					{lang.t.auth.login()}
				</LoadingButton>

				<RequestPasswordResetButton email={form.data("email")} />
				<ErrorLabel errors={loginMutation.error?.message || form.errors()} />

			</FormContainer>
		</CenteredContainer>
	)
}

const AuthPage = () => {
	useRedirectWhenLoggedIn()

	return (
		<Routes>
			<Route path="/" element={<EmailStep />} />
			<Route path="/new" element={<NewUserStep />} />
			<Route path="/existing" element={<ExistingUserStep />} />
		</Routes>
	)
}

export default AuthPage