/* import {
	Button,
	Card,
	CardContent,
	CardHeader,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Stack,
	TextField,
	Typography,
} from "@suid/material"
import { createSignal } from "solid-js"
import { LoadingButton } from "@/components/LoadingButton"
import Notifications from "@/components/Notifications"
import { trpc } from "@/trpc"
import { PubVirtualMachineS } from "@/types"

const SetVNCPasswordModal = (props: {
	vm: PubVirtualMachineS
	open: boolean
	onClose: () => void
}) => {
	const setVncPasswordMutation = trpc.vms.setVncPassword.useMutation({
		onSuccess: () => {
			Notifications.notify({
				message: "VNC Password successfully sat!",
				type: "success",
				time: 5000,
			})
		},
		onSettled: () => {
			props.onClose()
		},
	})
	let passwordRef: any

	return (
		<Dialog open={props.open} onClose={props.onClose}>
			<DialogTitle>Set VNC Password</DialogTitle>
			<DialogContent>
				<DialogContentText>
					Enter a password to access your VPS via VNC.
				</DialogContentText>
				<TextField
					autoFocus
					margin="dense"
					label="Password"
					type="password"
					id="password"
					fullWidth
					inputRef={(ref) => {
						passwordRef = ref
					}}
				/>
			</DialogContent>
			<DialogActions>
				<LoadingButton
					loading={setVncPasswordMutation.isLoading}
					onClick={() => {
						setVncPasswordMutation.mutateAsync({
							id: props.vm.id,
							password: passwordRef?.value,
						})
					}}
				>
					Set Password
				</LoadingButton>
			</DialogActions>
		</Dialog>
	)
}

export const VNCDetails = (props: {
	vm: PubVirtualMachineS
}) => {
	const [isVncPasswordOpen, setIsVncPasswordOpen] = createSignal(false)

	return (
		<>
			<SetVNCPasswordModal
				vm={props.vm}
				open={isVncPasswordOpen()}
				onClose={() => setIsVncPasswordOpen(false)}
			/>

			<Card>
				<CardHeader
					title="VNC"
					subheader={
						<Typography variant="body2">Access your VPS via VNC</Typography>
					}
				/>
				<CardContent>
					<Stack spacing={2} direction="row" justifyContent="space-between">
						<div>
							<Typography variant="body2">IP: {props.vm.vnc?.ip}</Typography>
							<Typography variant="body2">
								Port: {props.vm.vnc?.port}
							</Typography>
						</div>

						<Button
							variant="contained"
							color="primary"
							onClick={() => setIsVncPasswordOpen(true)}
						>
							Set VNC Password
						</Button>
					</Stack>
				</CardContent>
			</Card>
		</>
	)
}
 */