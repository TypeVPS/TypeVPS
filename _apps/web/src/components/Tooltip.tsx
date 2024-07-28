import { Paper } from "@suid/material"
import { createSignal, JSX } from "solid-js"

export const HoverTooltip = (props: {
	children: JSX.Element
	tooltip: JSX.Element
}) => {
	const [hover, setHover] = createSignal(false)

	return (
		<div
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			style={{
				position: "relative",
				display: "inline-block",
			}}
		>
			{props.children}
			<Paper
				style={{
					position: "absolute",
					"z-index": 1,
					bottom: "100%",
					left: "50%",
					transform: "translate(-50%, -4px)",

					visibility: hover() ? "visible" : "hidden",
					width: "200px",
				}}
			>
				{props.tooltip}
			</Paper>
		</div>
	)
}
