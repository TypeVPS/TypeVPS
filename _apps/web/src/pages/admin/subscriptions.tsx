import { SubPageTitle } from "."
import { SubscriptionsTable } from "@/components/tables/Subscriptions"
import lang from "@/lang"
import { trpc } from "@/trpc"

const AdminSubscriptionsPage = () => {
	const subscriptions = trpc.subscriptions.list.useQuery(() => ({
		listAllUsers: true,
	}))

	return (
		<div>
			<SubPageTitle title={lang.t.subscriptions()} />
			<SubscriptionsTable
				subscriptions={subscriptions.data ?? []}
				loading={subscriptions.isLoading}
				showUserCell={true}
			/>
		</div>
	)
}

export default AdminSubscriptionsPage
