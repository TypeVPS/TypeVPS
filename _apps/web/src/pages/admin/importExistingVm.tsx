import { createForm } from "@felte/solid";
import { validator } from "@felte/validator-zod";
import {
	Button,
	ButtonGroup,
	Dialog,
	DialogContent,
	DialogTitle,
	Stack,
	Typography,
} from "@suid/material";
import { createSignal } from "solid-js";
import { z } from "zod";
import { ConfirmButton } from "@/components/ConfirmButton";
import { EasyTable } from "@/components/EasyTable";
import { UserSelect } from "@/components/UserSelect";
import { FormTextField } from "@/components/form/FormTextField";
import { trpc } from "@/trpc";
import { FormSelect } from "@/components/form/FormSelect";
import { sizeBytesToHuman, zod } from "@typevps/shared";
import { ErrorLabel } from "@/components/ErrorLabel";
import { LoadingButton } from "@/components/LoadingButton";

const [selectedVm, setSelectedVm] = createSignal<{
	node: string;
	vmid: number;
} | null>(null);
const ImportVmDialog = () => {
	const schema = z.object({
		userId: z.number(),
		monthlyPrice: z.number(),
		validForDays: z.number(),
	}).merge(zod.admin.addIpPrefix);
	type Schema = z.infer<typeof schema>;

	const importVmMutation = trpc.vmAdmin.importVm.useMutation()
	const form = createForm<Schema>({
		extend: [validator({ schema, level: "error" })],
		onSubmit: (a) => {
			const vm = selectedVm()
			if (!vm) return

			importVmMutation.mutate({
				...a,
				node: vm.node,
				vmid: vm.vmid,
			})
		}
	});



	return (
		<Dialog open={selectedVm() !== null} onClose={() => setSelectedVm(null)}>
			<DialogTitle>Import VM</DialogTitle>
			<DialogContent>
				<form ref={form.form}>
					<Stack gap={2}>
						<Typography variant="body1">
							Are you sure you want to import this VM?
						</Typography>

						<UserSelect form={form} name="userId" />
						<FormTextField
							type="number"
							form={form}
							name="monthlyPrice"
							label="Monthly Price"
						/>

						<FormTextField
							type="number"
							form={form}
							name="validForDays"
							label="Valid for x days"
						/>

						{/* IP */}
						<FormSelect
							label="Kind"
							name="ipKind"
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
						<FormTextField label="IP" name="ipAddress" form={form} />
						<FormTextField label="Gateway" name="ipGateway" form={form} />
						<FormTextField label="Subnet-mask" name="ipSubnet" form={form} />

						<ErrorLabel mt={-1} errors={form.errors()} />

						<LoadingButton
							loading={importVmMutation.isLoading}
							variant="contained"
							type="submit"
						>
							import
						</LoadingButton>
					</Stack>
				</form>
			</DialogContent>
		</Dialog>
	);
};

const ImportExistingVMPage = () => {
	const notImportedVMs = trpc.vmAdmin.listNotImportedVms.useQuery();
	const deleteNotImportedVmMutation =
		trpc.vmAdmin.deleteNotImportedVm.useMutation({
			onSuccess: async () => {
				await notImportedVMs.refetch();
			},
		});

	return (
		<div>
			<ImportVmDialog />

			<EasyTable
				title="Imported existing VMs"
				data={
					notImportedVMs.data?.vms?.map((vm) => ({
						name: vm.name,
						status: vm.status,
						vcpu: vm.cpu,
						node: vm.node,
						memory: sizeBytesToHuman(vm.maxMem),
						actions: (
							<ButtonGroup>
								<Button
									onClick={() => {
										setSelectedVm({
											node: vm.node,
											vmid: vm.vmid,
										});
									}}
								>
									Import
								</Button>
								<ConfirmButton
									onClick={() => {
										deleteNotImportedVmMutation.mutate({
											node: vm.node,
											vmid: vm.vmid,
										});
									}}
								>
									Delete
								</ConfirmButton>
							</ButtonGroup>
						),
					})) ?? []
				}
				rows={[
					{
						label: "Name",
						key: "name",
					},
					{
						label: "Node",
						key: "node",
					},
					{
						label: "Status",
						key: "status",
					},
					{
						label: "vCPU",
						key: "vcpu",
					},
					{
						label: "Memory",
						key: "memory",
					},
					{
						label: "Actions",
						key: "actions",
						align: "right",
					},
				]}
			/>
		</div>
	);
};

export default ImportExistingVMPage;
