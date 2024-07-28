import { SubPageTitle } from "."
import { VirtualMachineTable } from "@/components/tables/VirtualMachines"
import lang from "@/lang"
import { trpc } from "@/trpc"

const AdminVirtualMachineListPage = () => {
	const vms = trpc.vms.list.useQuery(() => ({
		all: true,
	}))

	return (
		<div>
			<SubPageTitle title={"VMS"} />
			<VirtualMachineTable
				vms={vms.data}
				isLoading={vms.isLoading}
			/>
		</div>
	)
}
export default AdminVirtualMachineListPage
