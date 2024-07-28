import {
	Checkbox,
	FormControlLabel,
	Switch
} from "@suid/material"

export const FormCheckbox = (props: {
	label: string
	name: string
	disabled?: boolean
	defaultValue?: boolean
}) => {
	return (
		<>
			<FormControlLabel
				control={<Switch name={props.name} disabled={props.disabled} defaultChecked={props.defaultValue} />}
				label={props.label}
			/>
		</>
	)
}
