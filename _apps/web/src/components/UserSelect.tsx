import { trpc } from "@/trpc";
import { TypedForm } from "./form";
import { FormSelect } from "./form/FormSelect";

export const UserSelect = (props: {
	form: TypedForm;
	name: string;
}) => {
	const users = trpc.users.list.useQuery();
	return (
		<FormSelect
			form={props.form}
			label="User"
			name={props.name}
			options={
				users?.data?.map((user) => ({
					name: `${user.fullName} - ${user.email}`,
					id: user.id
				})) ?? []
			}
		/>
	);
};
