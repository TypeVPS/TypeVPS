import { Stack } from "@suid/material"
import { JSX } from "solid-js"

export const PageContainer = (props: {
	children: JSX.Element | JSX.Element[]
	maxWidth?: number
}) => {
	return (
		<Stack
			sx={{
				gap: 2,
				width: "100%",
				maxWidth: props.maxWidth || 1200,
				// center
				margin: "auto",
				padding: 2,
			}}
		>
			{props.children}
		</Stack>
	)
}
