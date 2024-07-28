import { FormControl, InputLabel, Select as MUISelect, MenuItem } from "@suid/material";
import { SelectChangeEvent } from "@suid/material/Select";
import { For, createSignal } from "solid-js";

export function Select(props: {
	options: {
		id: string;
		name: string;
	}[];
	label: string;
	name: string;
}) {
	const [value, setValue] = createSignal<string>("");

	return (
		<FormControl variant="outlined" fullWidth>
			<InputLabel>{props.label}</InputLabel>
			<MUISelect
				value={value()}
				label={props.name}
				name={props.name}
				onChange={(event: SelectChangeEvent) => {
					setValue(event?.target?.value ?? "");
				}}
			>
				<For each={props.options}>
					{(key) => <MenuItem value={key.id}>{key.name}</MenuItem>}
				</For>
			</MUISelect>
		</FormControl>
	);
}
