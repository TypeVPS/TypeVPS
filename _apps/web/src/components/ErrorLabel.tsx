import { Stack, Typography } from "@suid/material"
import { createMemo, For, Show } from "solid-js"

type MapErrors = { [key: string]: string[] | null }
export const hasError = (errors: MapErrors) => {
	for (const key in errors) {
		if (errors[key] !== null) {
			return true
		}
	}
}

export const ErrorLabel = (props: {
	errors: string[] | null | string | undefined | MapErrors
	// padding minus top
	mt?: number
}) => {
	const errors = createMemo(() => {
		if (!props.errors) return []

		// is it an array? return first error
		if (Array.isArray(props.errors)) {
			const first = props.errors[0] as string | undefined
			if(!first || typeof first !== "string") return []

			if (typeof first === "string") return [first]
		}

		// is it an object? return all errors
		if (typeof props.errors === "object") {
			const errors = []
			const propErrors = props.errors as {
				[key: string]: string | null
			}

			for (const key in propErrors) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const error = propErrors[key]
				if (!error) continue

				if (error === null) {
					continue
				}

				errors.push(`${key}: ${error}`)
			}

			return errors
		}

		// is it a string? return it
		if (typeof props.errors === "string") return [props.errors]

		return []
	})

	return (
		<Show when={errors().length > 0}>
			<Stack gap={1}>
				<For each={errors()}>
					{(error) => (
						<Typography color="error" variant="body2" mt={props.mt}>
							{error}
						</Typography>
					)}
				</For>
			</Stack>
		</Show>
	)
}