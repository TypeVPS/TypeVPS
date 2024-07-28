import { Link } from "@solidjs/router";
import {
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Typography
} from "@suid/material";
import { For, createMemo } from "solid-js";
import lang from "@/lang";
import { trpc } from "@/trpc";
import {
	ApiSetupLogMessage
} from "@/types";
import { CreateSubPage } from "./base";

const Log = (props: { log: ApiSetupLogMessage }) => {
	const statusIcon = createMemo(() => {
		if (props.log.status === "ok") {
			return "✅";
		}
		if (props.log.status === "error") {
			return "❌";
		}
		return "⏳";
	});

	return (
		<Typography variant="body2" width="100%">
			{lang.formatTime(props.log.date)} - {props.log.message} - {statusIcon()}
		</Typography>
	);
};

const VPSSetupLogs = CreateSubPage((props) => {
	const liveLogs = trpc.vmInstall.liveLogs.useQuery(
		() => {
			return {
				id: props.vm.id,
			};
		},
		{
			refetchInterval: 500,
		},
	);

	return (
		<Card>
			<CardHeader title="Logs" />
			<CardContent>
				<For each={liveLogs?.data?.messages ?? []}>
					{(log) => <Log log={log} />}
				</For>
				<Box mt={2} />

				{liveLogs.data?.status === "success" && (
					<Button
						LinkComponent={Link}
						href={`/servers/${props.vm.id}/overview`}
						variant="contained"
						fullWidth
					>
						CONTINUE TO PANEL
					</Button>
				)}

				{liveLogs.data?.status === "failed" && (
					<Chip label="Failed" color="error" />
				)}
			</CardContent>
		</Card>
	);
});

export default VPSSetupLogs;
