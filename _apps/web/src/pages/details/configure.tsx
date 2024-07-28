import { createForm } from "@felte/solid";
import { validator } from "@felte/validator-zod";
import {
	Alert,
	Button,
	Stack,
	TextField,
	Typography
} from "@suid/material";
import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { z } from "zod";
import { ErrorLabel } from "@/components/ErrorLabel";
import { LoadingButton } from "@/components/LoadingButton";
import {
	PasswordInput, PasswordInputWithGenerate
} from "@/components/PasswordWithGenerate";
import { SSHKeySelector } from "@/components/SSHKeySelector";
import { FormSelect } from "@/components/form/FormSelect";
import lang from "@/lang";
import { trpc } from "@/trpc";
import { CreateSubPage } from "./base";
import { TypedForm } from "@/components/form";
import { ApiVirtualMachine } from "@/types";
import { FormTextField } from "@/components/form/FormTextField";
import { LiveLogsButton } from "@/components/LiveLogsButton";
import { Link, useNavigate } from "@solidjs/router";
import { FormCheckbox } from "@/components/form/FormCheckbox";

const TemplateSelector = (props: {
	name: string;
	form: TypedForm;
	disabled?: boolean;
}) => {
	const templates = trpc.templates.list.useQuery();

	return (
		<>
			{templates.data && (
				<FormSelect
					form={props.form}
					disabled={props.disabled}
					options={templates.data.map((template) => {
						return {
							value: template.id,
							label: template.name,
						};
					})}
					label="Template"
					name={props.name}
				/>
			)}
		</>
	);
};

const VPSInstallPage = CreateSubPage((props) => {
	const installMutation = trpc.vmInstall.install.useMutation({});

	const schema = z.object({
		username: z
			.string()
			.min(3)
			.refine((v) => {
				if (v === undefined) return true;

				// make sure the username is a valid linux username and windows username
				return /^[a-zA-Z0-9_-]{3,16}$/.test(v);
			}),
		password: z.string().min(6).max(32),
		//vncPassword: z.string().min(6).max(32),
		templateId: z.string().min(1),
		sshKeyIds: z.array(z.string()).default([]),
		passwordLessSudo: z.boolean().optional(),
		allowPasswordAuthentication: z.boolean().optional(),
	});

	type Schema = z.infer<typeof schema>;
	const form = createForm<Schema>({
		extend: [validator({ schema, level: "error" })],
		onSubmit: (values) => {
			installMutation.mutate({
				type: "template",
				id: props.vm.id,
				...values,
				sshKeyIds: values.sshKeyIds ?? [],
			});
		},
	});

	const isInstalled = createMemo(() => {
		if (props.vm.product.installStatus !== "AWAITING_CONFIG") {
			return true;
		}

		if (props.vm.state) {
			return true;
		}
	});

	const templates = trpc.vmInstall.listTemplates.useQuery();
	// find selected template
	const selectedTemplate = createMemo(() => {
		if (!templates.data) return undefined;

		return templates.data.find((template) => {
			return template.id === form.data('templateId');
		});
	});
	const isWindows = createMemo(() => {
		if (!selectedTemplate()) return false;

		return selectedTemplate()?.osType === 'WINDOWS';
	});
	const isLinux = createMemo(() => {
		if (!selectedTemplate()) return false;

		return selectedTemplate()?.osType === 'LINUX';
	});

	createEffect(() => {
		if (isWindows()) {
			form.setFields('username', 'Administrator');
		}
	});

	const navigate = useNavigate();
	const isInstalling = createMemo(() => {
		return installMutation.isLoading || installMutation.isSuccess;
	});

	createEffect(() => {
		if (isInstalled() && !isInstalling()) {
			installMutation.reset();
			// go to delete page
			navigate(`/servers/${props.vm.id}/delete`);
		}
	});

	const [isInstallSuccess, setIsInstallSuccess] = createSignal(false);

	const Step = (props: { header: string }) => {
		return (
			<Typography variant="h3" mt={2}>
				{props.header}
			</Typography>
		);
	}


	return (
		<form ref={form.form}>
			<Stack gap={4}>
				<div />

				<Stack gap={2}>
					<Typography variant="h2">
						{lang.t.configureVM()}
					</Typography>
					<Typography variant="body2" mt={-1}>
						{lang.t.configureVMDescription()}
					</Typography>

					<Step header="Operating System" />
					<TemplateSelector form={form} name="templateId" disabled={isInstalling()} />

					<Step header="User Account" />
					<FormTextField
						name="username"
						label="username"
						form={form}
						disabled={isWindows() || isInstalling()}
					/>

					<PasswordInputWithGenerate generateOnMount={true} name="password" label="Password" disabled={isInstalling()} />
					<ErrorLabel mt={-1} errors={form.errors("password")} />

					{isLinux() && <>
						<FormCheckbox name="passwordLessSudo" label="Password less sudo" disabled={isInstalling()} />

						<Step header="SSH Authentication" />
						<SSHKeySelector name="sshKeyIds" disabled={isInstalling()} form={form} />
						<FormCheckbox name="allowPasswordAuthentication" label="Allow password SSH" defaultValue={true} disabled={isInstalling()} />
					</>}


					<LiveLogsButton
						disabled={!form.isValid() || isInstalling()}
						loading={installMutation.isLoading}
						label={lang.t.configureVM()}
						liveLogId={installMutation.data?.liveLogId}
						onSuccess={() => { setIsInstallSuccess(true) }}
					/>
					<ErrorLabel mt={-1} errors={form.errors()} />

					<Show when={isInstallSuccess()}>
						<Button variant="contained" href={`/servers/${props.vm.id}/overview`} LinkComponent={Link}>
							{lang.t.goToProduct()}
						</Button>
					</Show>
				</Stack>
				{/* )} */}
			</Stack>
		</form>
	);
});

export default VPSInstallPage;
