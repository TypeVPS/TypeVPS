import { createForm } from "@felte/solid"
import { Add, Delete } from "@suid/icons-material"
import {
	Button,
	ButtonGroup,
	Card,
	Chip,
	Dialog,
	DialogContent,
	DialogTitle,
	Stack,
	Typography,
} from "@suid/material"
import { createSignal } from "solid-js"
import lang from "@/lang"
//import { AdminAddIpInput } from "@typevps/shared/zod/admin"
import { DialogStack } from "@/components/DialogStack"
import { LoadingButton } from "@/components/LoadingButton"
import { FormTextField } from "@/components/form/FormTextField"
import { trpc } from "@/trpc"
//import { zod } from "@typevps/shared"
import { validator } from "@felte/validator-zod"
import { zod } from "@typevps/shared"
import { ConfirmButton } from "@/components/ConfirmButton"
import { EasyTable } from "@/components/EasyTable"
import { ErrorLabel } from "@/components/ErrorLabel"
import { FormSelect } from "@/components/form/FormSelect"
import { ApiIpConfig } from "@/types"
import { z } from "zod"



const [addIpDialogOpen, setAddIpDialogOpen] = createSignal(false)
const AddIpDialog = () => {
	const trpcContext = trpc.useContext()

	const addIpMutation = trpc.ips.add.useMutation()
	const form = createForm<z.infer<typeof zod.admin.addIp>>({
		extend: [validator({ schema: zod.admin.addIp, level: "error" })],
		onSubmit: async (a) => {
			await addIpMutation.mutateAsync(a)
			await trpcContext.ips.list.invalidate()
			await trpcContext.ips.stats.invalidate()
		},
	})

	return (
		<Dialog open={addIpDialogOpen()} onClose={() => setAddIpDialogOpen(false)}>
			<DialogTitle>{lang.t.addIp()}</DialogTitle>

			<DialogContent>
				<form ref={form.form}>
					<DialogStack>
						<FormSelect
							label="Kind"
							name="kind"
							form={form}
							options={[
								{
									value: "IPV4",
									label: "IPv4",
								},
								{
									value: "IPV6",
									label: "IPv6",
								},
							]}
						/>
						<FormTextField label="IP" name="address" form={form} />
						<FormTextField label="Gateway" name="gateway" form={form} />
						<FormTextField label="Subnet-mask" name="subnet" form={form} />
						<ErrorLabel mt={-1} errors={form.errors()} />

						<LoadingButton
							loading={addIpMutation.isLoading}
							variant="contained"
							type="submit"
						>
							{lang.t.addIp()}
						</LoadingButton>
					</DialogStack>
				</form>
			</DialogContent>
		</Dialog>
	)
}

const AdminIpTable = () => {
	const ips = trpc.ips.list.useQuery()

	const ActionButtons = (props: { ip: ApiIpConfig }) => {
		const trpcContext = trpc.useContext()
		const deleteMutation = trpc.ips.remove.useMutation({
			onSuccess: async () => {
				await trpcContext.ips.list.invalidate()
				await trpcContext.ips.stats.invalidate()
			}
		})

		return (
			<ButtonGroup>
				<ConfirmButton
					onClick={() => {
						if (props.ip.AssignedIpAddress) {
							alert("IP is in use, can't delete")
							return
						}

						deleteMutation.mutate({
							id: props.ip.id,
						})
					}}
					startIcon={<Delete />}
				>
					{lang.t.delete()}
				</ConfirmButton>
			</ButtonGroup>
		)
	}

	return (
		<EasyTable
			title={lang.t.ips()}
			loading={ips.isLoading}
			right={
				<Button
					startIcon={<Add />}
					onClick={() => setAddIpDialogOpen(true)}
					variant="contained"
				>
					{lang.t.addIp()}
				</Button>
			}
			rows={[
				{
					key: "status",
					label: "Status",
				},
				{
					key: "ip",
					label: "IP",
				},
				{
					key: "gateway",
					label: "Gateway",
				},
				{
					key: "subnet",
					label: "Subnet",
				},
				{
					key: "kind",
					label: "Kind",
				},
				{
					key: "actions",
					label: "Actions",
					align: "right",
				},
			]}
			data={
				ips.data?.map((ip) => ({
					status: (
						<Chip
							label={ip.AssignedIpAddress ? "In use" : "Free"}
							color={ip.AssignedIpAddress ? "error" : "success"}
						/>
					),
					ip: ip.address,
					gateway: ip.gateway,
					subnet: ip.subnet,
					kind: ip.kind,
					actions: <ActionButtons ip={ip} />,
				})) ?? []
			}
		/>
	)
}

const StatCard = (props: {
	header: string
	value: string | number
}) => {
	return (
		<Card
			sx={{
				padding: 2,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
			}}
		>
			<Typography variant="h6">{props.header}</Typography>
			<Typography variant="h4">{props.value}</Typography>
		</Card>
	)
}

const IpStats = () => {
	const stats = trpc.ips.stats.useQuery()

	return (
		<Stack spacing={2} direction={"row"}>
			<StatCard header="Total" value={stats.data?.total ?? 0} />
			<StatCard
				header="IPv4"
				value={`${stats.data?.ipv4Assigned ?? 0} / ${stats.data?.ipv4 ?? 0}`}
			/>
			<StatCard
				header="IPv6"
				value={`${stats.data?.ipv6Assigned ?? 0} / ${stats.data?.ipv6 ?? 0}`}
			/>
		</Stack>
	)
}

const AdminIpPage = () => {
	return (
		<>
			<AddIpDialog />

			<IpStats />

			<AdminIpTable />
		</>
	)
}
export default AdminIpPage
