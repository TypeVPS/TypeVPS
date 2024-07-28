import { Button, CircularProgress } from "@suid/material";
import { createMemo } from "solid-js";

// infer button input props
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ButtonProps = typeof Button extends (props: infer P) => any
	? P
	: never;

export const LoadingButton = (
	// all props from mui button, and a loading state
	props: ButtonProps & { loading?: boolean },
) => {
	const loading = createMemo(() => props.loading ?? false);

	return (
		<Button
			{...props}
			disabled={loading() || props.disabled}
			startIcon={loading() ? <CircularProgress size={24} /> : props.startIcon}
		>
			{props.children}
		</Button>
	);
};
