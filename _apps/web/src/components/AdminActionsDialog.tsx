import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	Stack,
	TextField,
	Typography
} from "@suid/material";
import { JSX, createSignal } from "solid-js";
import { trpc } from "@/trpc";
import { ConfirmButton } from "./ConfirmButton";
import { LoadingButton } from "./LoadingButton";
import { useNavigate } from "@solidjs/router";

const [vmId, setVmId] = createSignal<string | null>(null);

export const openAdminActionsDialog = (vmId: string) => {
	setVmId(vmId);
};

export const AdminActionsDialog = () => {
	const ActionC = (props: {
		label: string;
		children: JSX.Element;
	}) => {
		return (
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Typography variant="body1">{props.label}</Typography>
				<Stack
					direction="row"
					spacing={1}
					justifyContent="flex-end"
					alignItems="center"
				>
					{props.children}
				</Stack>
			</Stack>
		);
	};

	const forceInstallStateToWaitingForConfig =
		trpc.vmAdmin.forcesInstallStateToPendingInstall.useMutation();

	const navigate = useNavigate()
	const deleteVmMutation = trpc.vmAdmin.delete.useMutation({
		onSuccess: () => {
			navigate("/admin/vms")
		}
	});

	return (
		<>
			<Dialog open={vmId() !== null} onClose={() => setVmId(null)}>
				<DialogTitle>Admin Actions</DialogTitle>
				<DialogContent sx={{ width: 500 }}>
					<Stack spacing={2}>
						<ActionC label="Extend">
							<TextField
								size="small"
								placeholder="Days to extend"
								type="number"
							/>
							<Button variant="contained" >
								Extend
							</Button>
						</ActionC>
						<Divider />
						<ActionC label="Delete">
							<ConfirmButton
								onClick={() => {
									deleteVmMutation.mutate({
										id: vmId() ?? "",
									});
								}}
								loading={deleteVmMutation.isLoading}
								variant="contained"
								color="error"
								confirmText="Are you sure you want to delete this virtual machine?"
							>
								Delete Virtual Machine
							</ConfirmButton>
						</ActionC>
						<Divider />
						<ActionC label="Edit configuration">
							<Button variant="contained">Edit</Button>
						</ActionC>
						<ActionC label="Force state to 'waiting_for_config'">
							<LoadingButton
								loading={forceInstallStateToWaitingForConfig.isLoading}
								onClick={() => {
									forceInstallStateToWaitingForConfig.mutate({
										id: vmId() ?? "",
									});
								}}
								variant="contained"
							>
								Force
							</LoadingButton>
						</ActionC>
					</Stack>
				</DialogContent>
			</Dialog>
		</>
	);
};
