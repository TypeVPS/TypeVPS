import { FormControl, InputLabel, MenuItem, Select } from "@suid/material";
import { createEffect, createSignal } from "solid-js";
import { TypedForm } from ".";
import { ErrorLabel } from "../ErrorLabel";

export const FormSelect = (props: {
	options: {
		value: string | number;
		label: string;
	}[];
	label: string;
	disabled?: boolean;
	name: string;
	form: TypedForm;
	multi?: boolean;
	numericId?: boolean;
}) => {
	const [value, setValue] = createSignal<string | string[]>(
		// eslint-disable-next-line solid/reactivity
		props.multi ? [] : "",
	);
	createEffect(() => {
		{/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */ }
		const data = props.form.data(props.name);
		setValue(data ?? (props.multi ? [] : ""));
	});

	return (
		<>
			<FormControl variant="outlined" fullWidth>
				<InputLabel>{props.label}</InputLabel>

				<Select
					disabled={props.disabled}
					type={props.numericId ? "number" : "text"}
					multiple={props.multi}
					label={props.label}
					onChange={(e) => {
						const value = e.target.value as string;

						{/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */ }
						props.form.setData(props.name, value);
					}}
					value={value()}
				>
					{/* eslint-disable-next-line solid/prefer-for*/}
					{props.options.map((key) => (
						<MenuItem value={key.value}>{key.label}</MenuItem>
					))}
				</Select>
			</FormControl>

			{/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
			<ErrorLabel errors={props.form.errors(props.name)} />
		</>
	);
};
