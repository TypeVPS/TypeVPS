import { SubPageTitle } from "."
import { PaymentsTable } from "@/components/tables/Payments"
import lang from "@/lang"
import { trpc } from "@/trpc"

const AdminPaymentsPage = () => {
	const payments = trpc.payments.list.useQuery(() => ({
		listAllUsers: true,
	}))

	return (
		<div>
			<SubPageTitle title={lang.t.payments()} />
			<PaymentsTable
				payments={payments.data}
				isLoading={payments.isLoading}
				showUserCell={true}
			/>
		</div>
	)
}
export default AdminPaymentsPage
