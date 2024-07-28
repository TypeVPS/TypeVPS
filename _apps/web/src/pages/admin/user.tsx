import { useParams } from "@solidjs/router";
import { Typography } from "@suid/material";
import { createMemo } from "solid-js";
import { SubPageTitle } from ".";
import { SubscriptionsTable } from "@/components/tables/Subscriptions";
import { VirtualMachineTable } from "@/components/tables/VirtualMachines";
import { trpc } from "@/trpc";

const AdminUserPage = () => {
	const params = useParams();
	const userId = createMemo(() => {
		return parseInt(params.id) ?? -1;
	});
	const user = trpc.users.get.useQuery(() => ({
		id: userId(),
	}));

	return (
		<>
			<SubPageTitle title={`User: ${user.data?.fullName ?? ''}`} />

			<Typography variant="h6">VMs</Typography>
			<VirtualMachineTable
				vms={user.data?.UserVirtualMachines}
				isLoading={user.isLoading}
			/>

			<Typography variant="h6">Subscriptions</Typography>
			<SubscriptionsTable subscriptions={user.data?.Subscriptions ?? []} />
		</>
	);
};
export default AdminUserPage;
