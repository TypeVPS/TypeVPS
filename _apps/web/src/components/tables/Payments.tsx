import { Visibility } from "@suid/icons-material"
import {
	Button,
	ButtonGroup,
	Chip
} from "@suid/material"
import lang from "@/lang"
import { UserChip } from "../../pages/admin"
import { ApiPayment } from "@/types"
import { EasyTable } from "../EasyTable"

export const PaymentsTable = (props: {
	payments?: ApiPayment[]
	isLoading?: boolean
	showUserCell?: boolean
}) => {
	const PAYMENT_STATUS_COLOR_MAP: {
		status: ApiPayment["status"]
		color: "success" | "error" | "warning"
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
				status: "FAILED",
				color: "error",
			},
			{
				status: "COMPLETED",
				color: "success",
			},
		]
	return (
		<EasyTable
			loading={props.isLoading}
			rows={[
				{
					key: "user",
					label: lang.t.user(),
					disabled: !props.showUserCell,
				},
				{
					key: "amount",
					label: lang.t.amount(),
				},
				{
					key: "paymentMethod",
					label: lang.t.paymentMethod(),
				},
				{
					key: "paymentStatus",
					label: lang.t.paymentStatus(),
				},
				{
					key: "createdAt",
					label: lang.t.createdAt(),
				},
				{
					key: "actions",
					label: lang.t.actions(),
					align: "right",
				},
			]}
			data={
				props.payments?.map((payment) => {
					return {
						user:
							props.showUserCell && payment.User ? (
								<UserChip user={payment.User} />
							) : null,
						amount: lang.formatCurrency(payment.price),
						paymentMethod: payment.paymentProvider,
						paymentStatus: (
							<Chip
								label={payment.status}
								color={
									PAYMENT_STATUS_COLOR_MAP.find(
										(item) => item.status === payment.status,
									)?.color || "default"
								}
							/>
						),
						createdAt: lang.formatDateTime(payment.createdAt),
						actions: (
							<ButtonGroup>
								<Button startIcon={<Visibility />}>
									{lang.t.goToProduct()}
								</Button>
							</ButtonGroup>
						),
					}
				}) ?? []
			}
		/>
	)
}
