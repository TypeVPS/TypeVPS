import { Refresh, Visibility, VisibilityOff } from "@suid/icons-material"
import { Button, IconButton, Stack, TextField } from "@suid/material"
import { createSignal, onMount } from "solid-js"

export const PasswordInput = (props: {
	name: string
	label: string
	value?: string
	onChange?: (e: Event) => void
	disabled?: boolean
}) => {
	const [showPassword, setShowPassword] = createSignal(false)

	return (
		<TextField
			type={showPassword() ? "text" : "password"}
			name={props.name}
			value={props.value}
			onChange={props.onChange}
			label={props.label}
			disabled={props.disabled}
			fullWidth
			InputProps={{
				endAdornment: (
					<IconButton onClick={() => setShowPassword(!showPassword())}>
						{showPassword() ? <Visibility /> : <VisibilityOff />}
					</IconButton>
				),
			}}
		/>
	)
}

export const PasswordInputWithGenerate = (props: {
	name: string
	generateOnMount?: boolean
	label: string
	disabled?: boolean
}) => {
	const [password, setPassword] = createSignal("")

	const generatePassword = () => {
		const chrs =
			"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

		return Array(16)
			.fill(0)
			.map(() => {
				return chrs[Math.floor(Math.random() * chrs.length)]
			})
			.join("")
	}

	onMount(() => {
		if (props.generateOnMount) {
			const password = generatePassword()
			setPassword(password)
		}
	})

	return (
		<Stack direction="row" gap={1}>
			<PasswordInput
				label={props.label}
				name={props.name}
				value={password()}
				disabled={props.disabled}
				onChange={(e) => {
					setPassword((e.target as HTMLInputElement).value)
				}}
			/>

			<Button
				sx={{
					minWidth: 60,
				}}
				variant="contained"
				disabled={props.disabled}
				onClick={() => {
					const password = generatePassword()
					setPassword(password)
				}}
			>
				<Refresh />
			</Button>
		</Stack>
	)
}
