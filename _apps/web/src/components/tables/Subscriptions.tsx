import { Link } from "@solidjs/router";
import { Cancel, Visibility } from "@suid/icons-material";
import {
	Button,
	ButtonGroup,
	Chip
} from "@suid/material";
import lang from "@/lang";
import { UserChip } from "../../pages/admin";
import { trpc } from "@/trpc";
import { ApiSubscription } from "@/types";
import { ConfirmButton } from "../ConfirmButton";
import { EasyTable } from "../EasyTable";

const SubscriptionStatusChip = (props: {
	status: ApiSubscription["status"];
}) => {
	const PAYMENT_STATUS_COLOR_MAP: {
		status: ApiSubscription["status"];
		color: "success" | "error" | "warning";
	}[] = [
			{
				status: "CANCELLED",
				color: "warning",
			},
			{
				status: "PENDING",
				color: "warning",
			},
			{
				status: "PENDING_EXPIRED",
				color: "error",
			},
			{
				status: "ACTIVE",
				color: "success",
			},
			{
				status: "ACTIVE_TRAILING",
				color: "success",
			},
		];

	return (
		<Chip
			label={props.status}
			color={
				PAYMENT_STATUS_COLOR_MAP.find((item) => item.status === props.status)
					?.color || "default"
			}
		/>
	);
};

export const CancelSubscriptionButton = (props: {
	subscriptionId: string;
	disabled?: boolean;
	variant?: "text" | "outlined" | "contained";
	color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
	onSuccess?: () => void | Promise<void>;
}) => {
	const cancelMutation = trpc.subscriptions.cancel.useMutation({
		onSuccess: props.onSuccess,
	});

	return (
		<ConfirmButton
			confirmText={lang.t.cancelSubscriptionDialogMessage()}
			onClick={() => {
				cancelMutation.mutate({
					subscriptionId: props.subscriptionId,
				});
			}}
			loading={cancelMutation.isLoading}
			disabled={props.disabled}
			variant={props.variant}
			color={props.color}
			startIcon={<Cancel />}
		>
			{lang.t.cancel()}
		</ConfirmButton>
	);
};

export const SubscriptionsTable = (props: {
	subscriptions: ApiSubscription[];
	loading?: boolean;
	showUserCell?: boolean;
}) => {
	const trpcContext = trpc.useContext();
	const invalidate = async () => {
		await trpcContext.subscriptions.list.invalidate({
			listAllUsers: true,
		});

		await trpcContext.subscriptions.list.refetch();
	}

	const ActionButtons = (props: {
		subscription: ApiSubscription;
	}) => {
		return (
			<ButtonGroup>
				<CancelSubscriptionButton
					subscriptionId={props.subscription.id}
					disabled={props.subscription.status !== "ACTIVE" && props.subscription.status !== "ACTIVE_TRAILING"}
					variant="outlined"
					color="primary"
					onSuccess={() => {
						invalidate().catch((e) => {
							throw e
						});
					}}
				/>

				<Button
					LinkComponent={Link}
					href={`/payment/subscription/${props.subscription.id}`}
					startIcon={<Visibility />}
				>
					{lang.t.goToProduct()}
				</Button>
			</ButtonGroup>
		);
	};

	return (
		<EasyTable
			loading={props.loading}
			rows={[
				{
					key: "user",
					label: lang.t.name(),
					disabled: !props.showUserCell,
				},
				{
					key: "price",
					label: lang.t.price(),
				},
				{
					key: "paymentProvider",
					label: lang.t.paymentMethod(),
				},
				{
					key: "status",
					label: lang.t.status(),
				},
				{
					key: "createdAt",
					label: lang.t.createdAt(),
				},
				{
					key: "expireAt",
					label: lang.t.expiresOrRenewsAt(),
				},
				{
					key: "actions",
					label: lang.t.actions(),
					align: "right",
				},
			]}
			data={
				props.subscriptions.map((subscription) => {
					return {
						user: <UserChip user={subscription.User} />,
						price: lang.formatCurrency(subscription.price),
						paymentProvider: subscription.paymentProvider.toUpperCase(),
						status: <SubscriptionStatusChip status={subscription.status} />,
						createdAt: lang.formatDateTime(subscription.createdAt),
						expireAt: subscription.cancelledAt
							? lang.formatDateTime(subscription.cancelledAt)
							: "N/A",
						actions: <ActionButtons subscription={subscription} />,
					};
				}) ?? []
			}
		/>
	);
};
