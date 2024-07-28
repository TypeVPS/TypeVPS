import { Link } from "@solidjs/router";
import { Edit, Visibility } from "@suid/icons-material";
import { Button, ButtonGroup } from "@suid/material";
import { EasyTable } from "@/components/EasyTable";
import lang from "@/lang";
import { trpc } from "@/trpc";

const AdminUsersPage = () => {
	const users = trpc.users.list.useQuery();

	return (
		<EasyTable
			title={lang.t.users()}
			loading={users.isLoading}
			rows={[
				{
					key: "name",
					label: lang.t.name(),
				},
				{
					key: "email",
					label: lang.t.email(),
				},
				{
					key: "role",
					label: lang.t.role(),
				},
				{
					key: "actions",
					label: lang.t.actions(),
					align: "right",
				},
			]}
			data={
				users.data?.map((user) => {
					return {
						name: user.fullName,
						email: user.email,
						role: user.roles.join(", "),
						actions: (
							<ButtonGroup>
								<Button
									LinkComponent={Link}
									href={`/admin/user/${user.id}`}
									startIcon={<Visibility />}
								>
									{lang.t.view()}
								</Button>
								<Button startIcon={<Edit />}>{lang.t.edit()}</Button>
							</ButtonGroup>
						),
					};
				}) ?? []
			}
		/>
	);
};

export default AdminUsersPage;
