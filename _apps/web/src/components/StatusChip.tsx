import { Chip } from "@suid/material";
import { createMemo } from "solid-js";
import lang from "@/lang";

export const StatusChip = (props: {
	status: string | undefined;
	size?: "small" | "medium";
}) => {
	const status = createMemo(() => {
		const statusMap: {
			[key: string]: {
				label: string;
				color:
				| "default"
				| "error"
				| "info"
				| "success"
				| "warning"
				| "primary"
				| "secondary";
			};
		} = {
			running: {
				label: lang.t.running(),
				color: "success",
			},
			stopped: {
				label: lang.t.stopped(),
				color: "error",
			},
			unknown: {
				label: lang.t.unknown(),
				color: "warning",
			},
		};

		return statusMap[props.status ?? "unknown"];
	});

	return <Chip label={status().label} color={status().color} size={props.size} />;
};
