import {
	Link,
	Outlet,
	useLocation,
	useNavigate,
	useParams,
} from "@solidjs/router";
import {
	Alert,
	Button,
	ButtonGroup,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Grid,
	Paper,
	Stack,
	Typography
} from "@suid/material";
import {
	For,
	Show,
	createEffect,
	createMemo
} from "solid-js";
import {
	AdminActionsDialog,
	openAdminActionsDialog,
} from "@/components/AdminActionsDialog";
import { LoadingButton } from "@/components/LoadingButton";
import { PageContainer } from "@/components/PageContainer";
import { StatusChip } from "@/components/StatusChip";
import auth from "@/context/auth";
import { useVMConnectionDetailsDialog } from "@/dialog/vmConnectionDetails";
import lang from "@/lang";
import { trpc } from "@/trpc";
import { ApiVirtualMachine } from "@/types";
import { setVm } from "./base";
import { useBuyContext } from "@/components/Shopping";

const ActionButtons = (props: {
	vm: ApiVirtualMachine;
}) => {
	const trpcContext = trpc.useContext();
	const powerActionMutation = trpc.vms.powerAction.useMutation({
		onSuccess: async () => {
			await trpcContext.vms.get.invalidate({ id: props.vm.id });
		},
	});

	return (
		<>
			<ButtonGroup fullWidth>
				<LoadingButton
					variant="contained"
					disabled={props.vm.state?.status === "stopped"}
					loading={
						powerActionMutation.isLoading &&
						props.vm.state?.status === "running"
					}
					onClick={() => {
						powerActionMutation.mutate({
							id: props.vm.id,
							action: "stop",
						});
					}}
				>
					{lang.t.stop()}
				</LoadingButton>

				<LoadingButton
					variant="contained"
					disabled={props.vm.state?.status === "running"}
					loading={
						powerActionMutation.isLoading &&
						props.vm.state?.status === "stopped"
					}
					onClick={() => {
						powerActionMutation.mutate({
							id: props.vm.id,
							action: "start",
						});
					}}
				>
					{lang.t.start()}
				</LoadingButton>
			</ButtonGroup>
		</>
	);
};

const useDetails = () => {
	const _params = useParams();
	const details = trpc.vms.get.useQuery(
		() => {
			return {
				id: _params["id"],
			};
		},
		{
			refetchInterval: 2000,
		},
	);

	createEffect(() => {
		setVm(details.data);
	});

	return details;
};

const SubscriptionDetails = (props: {
	vm: ApiVirtualMachine;
}) => {
	const trpcContext = trpc.useContext();
	const onSuccess = () => {
		void trpcContext.userPaidServices.get.invalidate({
			id: props.vm.userPaidService.id,
		});
		void trpcContext.vms.get.invalidate({ id: props.vm.id });
	};
	const userPaidService = trpc.userPaidServices.get.useQuery(() => ({
		id: props.vm.userPaidService.id,
	}));

	const cancelSubscriptionMutation = trpc.subscriptions.cancel.useMutation({
		onSuccess: () => {
			onSuccess();
		},
	});

	const buyContext = useBuyContext()

	return (
		<Card>
			<CardHeader
				title="Payment"
				action={
					<Stack gap={1}>
						<Chip
							label={lang.t.autoRenewOnOff({
								on: userPaidService.data?.autoRenewOn ?? false,
							})}
							color={userPaidService.data?.autoRenewOn ? "success" : "error"}
						/>
					</Stack>
				}
			/>
			<CardContent>
				<Stack spacing={2} direction="row">
					<Button
						sx={{ px: 4 }}
						variant="contained"
						onClick={() => {
							buyContext.openExtendUserServiceDialog(props.vm.userPaidService.id, false);
						}}
					>
						{lang.t.extend()}
					</Button>
					<LoadingButton
						fullWidth
						loading={cancelSubscriptionMutation.isLoading}
						variant="outlined"
						onClick={() => {
							if (
								userPaidService.data?.autoRenewOn &&
								userPaidService.data?.activeSubscription
							) {
								// alert, ask if they are sure
								if (
									!confirm("Are you sure you want to cancel your subscription?")
								) {
									return;
								}

								cancelSubscriptionMutation.mutate({
									subscriptionId: userPaidService.data.activeSubscription.id,
								});
							} else {
								buyContext.openExtendUserServiceDialog(props.vm.userPaidService.id, true);
							}
						}}
					>
						{lang.t.enableDisableAutoRenew({
							on: userPaidService.data?.autoRenewOn ?? false,
						})}
					</LoadingButton>
				</Stack>
			</CardContent>
		</Card>
	);
};

const LeftOverview = (props: {
	vm: ApiVirtualMachine;
}) => {
	const connectionDetailsDialog = useVMConnectionDetailsDialog()

	return (
		<Card>
			<CardHeader
				title={
					<Stack>
						<Typography variant="h6">{props.vm.product.name}</Typography>
						<Typography variant="body1">{props.vm.ipv4}</Typography>
					</Stack>
				}
				action={
					<Stack gap={1}>
						<StatusChip status={props.vm.state?.status ?? "unknown"} />
						<Chip
							size="small"
							label={`${lang.formatTimeLeft(
								props.vm.userPaidService.expiresAt,
								1,
							)} remaining`}
						/>
					</Stack>
				}
			/>

			<CardContent>
				<Stack gap={2}>
					<ActionButtons vm={props.vm} />
					<Button
						variant="outlined"
						onClick={() => {
							connectionDetailsDialog.open(props.vm.id);
						}}
					>
						{lang.t.connectionDetails()}
					</Button>

					<Button
						LinkComponent={Link}
						href={
							props.vm.product.installStatus === "AWAITING_CONFIG"
								? `/servers/${props.vm.id}/configure`
								: `/servers/${props.vm.id}/delete`
						}
						variant="outlined"
						color={props.vm.product.installStatus === 'AWAITING_CONFIG' ? 'success' : 'error'}
					>
						{
							props.vm.product.installStatus === 'AWAITING_CONFIG' ? lang.t.configureVM() : lang.t.reinstall()
						}
					</Button>
				</Stack>
			</CardContent>
		</Card>
	);
};

export const VPSDetailsPage = () => {
	const location = useLocation();
	const routeOptions = createMemo(() => getRouteOptions(location.pathname));

	const details = useDetails();
	const navigate = useNavigate();

	const hidePanel = createMemo(() => {
		if (!details.data) {
			return undefined;
		}

		if (details.data?.userPaidService.isExpired) {
			return `The VPS expired at ${new Date(
				details.data.userPaidService.expiresAt ?? 0,
			).toLocaleString()}. If the VPS expired mistakenly, please contact support as soon as possible to figure out if the data can be restored.`;
		}

		if (!details.data.state && !routeOptions()?.hidePanel) {
			return "The VPS state cannot be found in our virtualization software. Please contact support, if this issue persists.";
		}

		if (routeOptions()?.hidePanel) {
			return "";
		}

		return undefined;
	});

	createEffect(() => {
		if (details.data?.product.installStatus === "AWAITING_CONFIG") {
			navigate(`/servers/${details.data.id}/configure`);
		}
	})

	return (
		<PageContainer maxWidth={1400}>
			{auth.isAdmin() && <AdminActionsDialog />}
			{auth.isAdmin() && (
				<Button
					variant="outlined"
					color="error"
					onClick={() => openAdminActionsDialog(details.data?.id ?? '')}
				>
					Admin Actions
				</Button>
			)}

			<Show when={hidePanel()}>
				<Alert severity="error">{hidePanel()}</Alert>
			</Show>

			<Show when={!routeOptions()?.hidePanel} fallback={<Outlet />}>
				{details.data && (
					<Grid container spacing={2}>
						<Grid item xs={12} xl={3}>
							<Stack spacing={2}>
								<LeftOverview vm={details.data} />
								<SubscriptionDetails vm={details.data} />
							</Stack>
						</Grid>

						<Grid item xs={12} xl={9}>
							<Stack gap={2}>
								<Paper sx={{ p: 2 }}>
									<NavHeader />
								</Paper>
								<Outlet />
							</Stack>
						</Grid>
					</Grid>
				)}
			</Show>
		</PageContainer>
	);
};

const pages = [
	{
		name: lang.t.routeNames.serverRoutes.overview(),
		path: "overview",
	},
	{
		name: lang.t.routeNames.serverRoutes.ddosIncidents(),
		path: "ddos"
	},
	{
		name: lang.t.routeNames.serverRoutes.settings(),
		path: "settings",
		disabled: true,
		hideFromSelector: true,
	},
	{
		name: lang.t.routeNames.serverRoutes.backups(),
		path: "backups",
		disabled: true,
		hideFromSelector: true,
	},
	{
		name: "configure",
		path: "configure",
		hidePanel: true,
		hideFromSelector: true,
	},
	{
		name: "delete",
		path: "delete",
		hidePanel: true,
		hideFromSelector: true,
	},
	{
		name: "installLogs",
		path: "installLogs",
		hidePanel: true,
		hideFromSelector: true,
	},
];

const getRouteOptions = (pathName: string) => {
	const path = pathName.split("/").pop();
	if (!path) {
		return undefined;
	}

	return pages.find((page) => page.path === path);
};

function NavHeader() {
	const location = useLocation();
	const locationEnding = createMemo(() => {
		return location.pathname.split("/").pop();
	});

	return (
		<Stack direction="row" gap={1}>
			<For each={pages
				.filter((page) => !page.hideFromSelector)}>{(page) => {
					return (
						<Button
							fullWidth
							disabled={page.disabled}
							LinkComponent={Link}
							variant={
								locationEnding() === page.path ? "contained" : "outlined"
							}
							href={page.path}
						>
							{page.name}
						</Button>
					);
				}}</For>
		</Stack>
	);
}

export default VPSDetailsPage