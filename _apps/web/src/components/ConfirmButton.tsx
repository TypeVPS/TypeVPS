// extend MUI button with a alert asking for confirmation
// https://material-ui.com/components/buttons/#customized-buttons

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from "@suid/material"
import { JSX, createSignal } from "solid-js"
import { LoadingButton } from "./LoadingButton"

// just trigger onClick on confirm
export const ConfirmButton = (props: {
	onClick: () => void
	loading?: boolean
	children: JSX.Element
	confirmText?: string
	variant?: "contained" | "outlined" | "text"
	color?: "primary" | "secondary" | "error" | "info" | "success" | "warning"
	disabled?: boolean
	startIcon?: JSX.Element
}) => {
	const [isConfirmOpen, setIsConfirmOpen] = createSignal(false)

	return (
		<>
			<LoadingButton
				startIcon={props.startIcon}
				disabled={props.disabled}
				loading={props.loading}
				variant={props.variant}
				color={props.color}
				onClick={() => {
					setIsConfirmOpen(true)
				}}
			>
				{props.children}
			</LoadingButton>
			<Dialog open={isConfirmOpen()} onClose={() => setIsConfirmOpen(false)}>
				<DialogTitle>Confirm</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{props.confirmText || "Are you sure?"}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
					<Button
						onClick={() => {
							props.onClick()
							setIsConfirmOpen(false)
						}}
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}
