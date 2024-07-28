import {
	Button,
	Card,
	CardContent,
	CardHeader,
	Stack,
	TextField,
	Typography
} from "@suid/material"
import { PageContainer } from "@/components/PageContainer"
import { PaymentsTable } from "@/components/tables/Payments"
import { SubscriptionsTable } from "@/components/tables/Subscriptions"
import auth from "@/context/auth"
import lang from "@/lang"
import { trpc } from "@/trpc"

const LogoutButton = () => {
	const logoutMutation = trpc.auth.logout.useMutation({
		onSuccess: () => {
			auth.updateJwtFromCookie()
		},
	})
	return (
		<Button
			variant="contained"
			color="primary"
			onClick={() => {
				logoutMutation.mutate()
			}}
		>
			Logout
		</Button>
	)
}

const Subscriptions = () => {
	const subscriptions = trpc.subscriptions.list.useQuery(() => ({}))

	return (
		<Card>
			<CardHeader
				title={lang.t.subscriptions()}
				subheader={
					<Typography variant="body2">{lang.t.subscriptions()}</Typography>
				}
			/>

			<CardContent>
				<SubscriptionsTable
					subscriptions={subscriptions.data ?? []}
					loading={subscriptions.isLoading}
				/>
			</CardContent>
		</Card>
	)
}

const Payments = () => {
	const payments = trpc.payments.list.useQuery(() => ({}))

	return (
		<Card>
			<CardHeader
				title={lang.t.payments()}
				subheader={<Typography variant="body2">{lang.t.payments()}</Typography>}
			/>

			<CardContent>
				<PaymentsTable
					payments={payments.data}
					isLoading={payments.isLoading}
				/>
			</CardContent>
		</Card>
	)
}

const SettingsPage = () => {
	return (
		<PageContainer>
			<Card>
				<CardHeader
					title="Account"
					subheader={
						<Typography variant="body2">
							{lang.t.changeAccountDetails()}
						</Typography>
					}
				/>

				<CardContent>
					{/* Change name */}
					{/* Change email */}
					{/* Change password */}
					{/* Delete account */}
					{/* Two factor */}
					<Stack spacing={2} direction="column">
						<TextField
							label={lang.t.fullName()}
							disabled
							value={auth.userData()?.fullName}
						/>
						<TextField
							label={lang.t.email()}
							disabled
							value={auth.userData()?.email}
						/>
						<Stack direction="row" spacing={2}>
							<Button variant="contained" color="primary">
								{lang.t.changePassword()}
							</Button>

							{/* <DeleteAccountButton /> */}
							<LogoutButton />
						</Stack>
					</Stack>
				</CardContent>
			</Card>

			<Subscriptions />
			<Payments />
		</PageContainer>
	)
}
export default SettingsPage
