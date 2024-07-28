import {
	ErrorRounded
} from "@suid/icons-material"
import {
	Button,
	Chip,
	Stack,
	Typography
} from "@suid/material"
import { Show, createMemo } from "solid-js"
import { CardEasyTable } from "@/components/EasyTable"
import lang from "@/lang"
import { trpc } from "@/trpc"
import {
	ApiVirtualMachine
} from "@/types"
import { CreateSubPageState } from "./base"

const Users = (props: {
	vm: ApiVirtualMachine
}) => {
	const disabledMessage = createMemo(() => {
		if (props.vm.state?.status !== "running") {
			return "VM is not running. You need to start it to manage users."
		}

		if (!props.vm.guestToolsRunning) {
			return "Guest tools are not running. You need to install them to manage users."
		}

		return undefined
	})

	const users = trpc.vms.agent.users.useQuery(
		() => {
			return {
				id: props.vm.id,
			}
		},
		{
			get enabled() {
				return !disabledMessage()
			},
		},
	)

	return (
		<CardEasyTable
			title={lang.t.users()}
			subTitle="Manage OS users."
			disabledMessage={disabledMessage()}
			loading={users.isLoading}
			bottom={
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="flex-end"
					gap={1}
				>
					<Show when={!props.vm.guestToolsRunning}>
						<Typography variant="caption">
							<Chip
								icon={<ErrorRounded />}
								label="You need to install guest tools to manage users."
								color="error"
								size="small"
							/>
						</Typography>
					</Show>

					<Button
						disabled={!props.vm.guestToolsRunning || users.isLoading}
						variant="contained"
					>
						Add user
					</Button>
				</Stack>
			}
			rows={[
				{
					key: "name",
					label: lang.t.user(),
				},
				{
					key: "loginTime",
					label: lang.t.lastLogin(),
				},
				{
					key: "actions",
					label: lang.t.actions(),
					align: "right",
				},
			]}
			data={
				users.data?.map((user) => ({
					name: user.name,
					loginTime: lang.formatDateTime(user.loginTime),
					actions: (
						<Stack justifyContent="flex-end" direction="row" spacing={1}>
							<Button size="small" variant="outlined">
								Reset password
							</Button>
							<Button size="small" variant="outlined">
								Remove
							</Button>
						</Stack>
					),
				})) ?? []
			}
		/>
	)
}

const VPSSettingsPage = CreateSubPageState((props) => {
	return (
		<>
			<Users vm={props.vm} />
		</>
	)
})

export default VPSSettingsPage
