import { createForm } from "@felte/solid"
import { validator } from "@felte/validator-zod"
import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	Stack,
	TextField
} from "@suid/material"
import { createSignal } from "solid-js"
import { z } from "zod"
import lang from "@/lang"
import { trpc } from "@/trpc"
import { ErrorLabel } from "./ErrorLabel"
import { LoadingButton } from "./LoadingButton"
import { Select } from "./Select"
import { FormSelect } from "./form/FormSelect"

const sshKeyRegex = {
	sshDsa: /^ssh-dss AAAA[0-9A-Za-z+/]+[=]{0,3}( [^@\s]+@[^@\s]+)?$/,
	sshRsa: /^ssh-rsa AAAA[0-9A-Za-z+/]+[=]{0,3}( [^@\s]+@[^@\s]+)?$/,
	sshEd25519: /^ssh-ed25519 AAAAC3NzaC1l[0-9A-Za-z/+]+[=]{0,3}( [^@\s]+@[^@\s]+)?$/,
}

export const AddSSHKeyPopup = (props: {
	isOpen: boolean
	onClose: () => void
}) => {
	const schema = z.object({
		name: z.string().min(4),
		key: z
			.string()
			.min(1)
			.refine((key) => {
				if (!key) return false

				const match = key.match(sshKeyRegex.sshDsa)
				if (match) return true

				const match2 = key.match(sshKeyRegex.sshRsa)
				if (match2) return true

				const match3 = key.match(sshKeyRegex.sshEd25519)
				if (match3) return true

				return false
			}),
	})

	type Schema = z.infer<typeof schema>
	const form = createForm<Schema>({
		extend: [validator({ schema, level: "error" })],
		onSubmit: (values) => {
			createSshKeyMutation.mutate(values)
		},
	})

	const trpcContext = trpc.useContext()
	const createSshKeyMutation = trpc.ssh.create.useMutation({
		onSuccess: () => {
			void trpcContext.ssh.list.invalidate()
			form.reset()
			props.onClose()
		},
	})

	return (
		<Dialog open={props.isOpen} onClose={props.onClose}>
			<DialogTitle>{lang.t.addSSHKey()}</DialogTitle>

			<form ref={form.form}>
				<DialogContent sx={{ minWidth: 500, maxWidth: "100%" }}>
					<Stack gap={2}>
						<TextField
							name="name"
							fullWidth
							label={lang.t.name()}
							sx={{ mt: 1 }}
						/>
						<ErrorLabel errors={form.errors("name")} />

						<TextField name="key" fullWidth label={lang.t.sshKey()} />
						<ErrorLabel errors={form.errors("key")} />

						<Button variant="outlined">Import from github</Button>

						<Stack direction="row" gap={2}>
							{/* cancel */}
							<Button fullWidth variant="outlined" onClick={props.onClose}>
								{lang.t.cancel()}
							</Button>

							{/* submit */}
							<LoadingButton
								loading={createSshKeyMutation.isLoading}
								fullWidth
								variant="contained"
								color="primary"
								type="submit"
							>
								{lang.t.add()}
							</LoadingButton>
						</Stack>
					</Stack>
				</DialogContent>
			</form>
		</Dialog>
	)
}

export const SSHKeySelector = (props: {
	name: string
	form: any
	disabled?: boolean
}) => {
	const sshKeys = trpc.ssh.list.useQuery()
	const [isOpen, setIsOpen] = createSignal(false)

	return (
		<Stack direction="row" gap={1}>
			<FormSelect
				label="SSH Key"
				name={props.name}
				options={sshKeys?.data?.map((sshKey) => ({
					label: sshKey.name,
					value: sshKey.id,
				})) ?? []}
				form={props.form}
				disabled={props.disabled}
				multi={true}
			/>
			<Button
				sx={{ minWidth: 140 }}
				variant="contained"
				onClick={() => {
					setIsOpen(true)
				}}
			>
				Add SSH Key
			</Button>

			<AddSSHKeyPopup isOpen={isOpen()} onClose={() => setIsOpen(false)} />
		</Stack>
	)
}
