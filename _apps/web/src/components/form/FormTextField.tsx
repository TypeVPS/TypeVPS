import { TextField } from "@suid/material"
import { ErrorLabel } from "../ErrorLabel"
import { TypedForm } from "."

export const FormTextField = (props: {
	name: string
	label: string
	form: TypedForm
	// support numbers
	type?: "text" | "number" | 'password'
	multiline?: boolean
	disabled?: boolean
	value?: string
	defaultValue?: string
}) => {
	return (
		<>
			<TextField
				value={props.value}
				multiline={props.multiline}
				name={props.name}
				fullWidth
				label={props.label}
				type={props.type ?? "text"}
				disabled={props.disabled}
				defaultValue={props.defaultValue}
			/>

			{/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
			<ErrorLabel errors={props.form.errors(props.name)} />
		</>
	)
}
