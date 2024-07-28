import { DialogBase } from "@/components/DialogBase"
import { EasyTable } from "@/components/EasyTable"
import { ErrorLabel } from "@/components/ErrorLabel"
import { LiveLogsButton } from "@/components/LiveLogsButton"
import { LoadingButton } from "@/components/LoadingButton"
import Notifications from "@/components/Notifications"
import { FormSelect } from "@/components/form/FormSelect"
import { FormTextField } from "@/components/form/FormTextField"
import lang from "@/lang"
import { trpc } from "@/trpc"
import { createForm } from "@felte/solid"
import { validator } from "@felte/validator-zod"
import { Dialog } from "@suid/material"
import { sizeBytesToHumanBigInt, zod } from "@typevps/shared"
import { CreateTemplateInput } from "@typevps/shared/src/zod/admin"
import { createContext, createMemo, createSignal, JSX, useContext } from "solid-js"

export const CreateTemplateContext = createContext<{
	open: () => void
}>()


const gbToBytes = (gb: number) => gb * 1024 * 1024 * 1024

export const AdminCreateTemplateProvider = (props: { children: JSX.Element }) => {
	const [isOpen, setIsOpen] = createSignal(false)
	const open = () => setIsOpen(true)

	const createTemplateMutation = trpc.templates.create.useMutation()

	const form = createForm<CreateTemplateInput>({
		extend: [validator({
			schema: zod.admin.createTemplate,
			level: "error"
		})],
		onSubmit: async (data) => {
			await createTemplateMutation.mutateAsync(data)
			//setIsOpen(false)
			Notifications.notify({
				message: "Creating template",
				time: 5000,
				type: "success"
			})
		}
	})

	return (
		<CreateTemplateContext.Provider value={{ open }}>
			<DialogBase
				open={isOpen()}
				onClose={() => setIsOpen(false)}
				title="Create Template"
				ref={form.form}
			>
				<FormTextField
					label="Name"
					name="name"
					form={form}
				/>

				<FormTextField
					label="Image URL"
					name="qcow2Url"
					form={form}
				/>

				{/* type select WINDOWS / LINUX*/}
				<FormSelect
					label="Type"
					name="osType"
					form={form}
					options={[
						{ label: "Windows", value: "WINDOWS" },
						{ label: "Linux", value: "LINUX" },
					]}
				/>

				{/* minimum disk size */}
				<FormSelect
					label="Min Disk Size"
					name="minimumDiskBytes"
					form={form}
					options={[
						{ label: "10 GB", value: gbToBytes(10) },
						{ label: "20 GB", value: gbToBytes(20) },
						{ label: "40 GB", value: gbToBytes(40) },
					]}
				/>
				{/* minimum ram size */}
				<FormSelect
					label="Min RAM Size"
					name="minimumRamBytes"
					form={form}
					options={[
						{ label: "1 GB", value: gbToBytes(1) },
						{ label: "2 GB", value: gbToBytes(2) },
						{ label: "4 GB", value: gbToBytes(4) },
					]}
				/>

				{/* minimum cpu count */}
				<FormSelect
					label="Min CPU Cores"
					name="minimumCpuCores"
					form={form}
					options={[
						{ label: "1", value: 1 },
						{ label: "2", value: 2 },
						{ label: "4", value: 4 },

					]}
				/>


				<LiveLogsButton
					label="Create"
					liveLogId={createTemplateMutation.data?.liveLogId}
					loading={createTemplateMutation.isLoading}
					variant="contained"
					disabled={!form.isValid()}
				/>


				<ErrorLabel errors={form.errors()} />

			</DialogBase>

			{props.children}
		</CreateTemplateContext.Provider>
	)
}

const useAdminTemplateContext = () => {
	const adminTemplateContext = useContext(CreateTemplateContext)
	if (!adminTemplateContext) {
		throw new Error("AdminTemplateContext not found")
	}

	return adminTemplateContext
}

const Actions = (props: { templateId: string }) => {
	const deleteTemplateMutation = trpc.templates.delete.useMutation()

	return (
		<LoadingButton
			variant="contained"
			onClick={() => deleteTemplateMutation.mutate({
				id: props.templateId
			})}
		>
			{lang.t.delete()}
		</LoadingButton>
	)
}

const TemplatePage = () => {
	const templates = trpc.templates.list.useQuery()
	const adminTemplateContext = useAdminTemplateContext()

	return (
		<div>
			<EasyTable
				title="Templates"
				create={adminTemplateContext.open}
				rows={[
					{ label: "Name", key: "name" },
					{ label: "OS Type", key: "osType" },
					{ label: "Minimum Disk Size", key: "minimumDiskBytes" },
					{ label: "Minimum RAM Size", key: "minimumRamBytes" },
					{ label: "Minimum CPU Cores", key: "minimumCpuCores", defaultValue: '' },
					{ label: "Actions", key: "actions", align: 'right' }
				]}
				data={templates?.data?.map((template) => ({
					name: template.name,
					osType: template.osType,
					minimumDiskBytes: sizeBytesToHumanBigInt(template.minimumDiskBytes),
					minimumRamBytes: sizeBytesToHumanBigInt(template.minimumRamBytes),
					minimumCpuCores: template.minimumCpuCores ?? '-1',
					actions: <Actions templateId={template.id} />
				}))}

			/>
		</div>
	)
}

export default TemplatePage;

// https://c.auxera.net/f/a66027a3badf4c2ea874/?dl=1