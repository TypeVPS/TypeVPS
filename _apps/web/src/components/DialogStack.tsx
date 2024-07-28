import { Stack } from "@suid/material"
import { JSX } from "solid-js"

export const DialogStack = (props: {
	children: JSX.Element | JSX.Element[]
}) => {
	return (
		<Stack mt={1} gap={3} width={600} maxWidth={"100%"}>
			{props.children}
		</Stack>
	)
}
