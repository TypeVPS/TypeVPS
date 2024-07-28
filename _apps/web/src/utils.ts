import { useMediaQuery } from "@suid/material";
import { Accessor, createEffect, createSignal } from "solid-js";

export const roundPrecision = (num: number, precision: number) => {
	const factor = Math.pow(10, precision);
	return Math.round(num * factor) / factor;
};

export const createDebounce = (
	value: Accessor<string>,
	delay = 500,
	onDebounce?: (value: string) => void,
) => {
	const [debouncedValue, setDebouncedValue] = createSignal(value());

	let timeout: NodeJS.Timeout
	createEffect(() => {
		value();
		clearTimeout(timeout);

		timeout = setTimeout(() => {
			if (onDebounce) {
				onDebounce(value());
			} else {
				setDebouncedValue(value());
			}
		}, delay);
	});

	return debouncedValue;
};


export function getCookie(n: string) {
	const a = `; ${document.cookie}`.match(`;\\s*${n}=([^;]+)`);
	return a ? a[1] : "";
}

export function removeCookie(n: string) {
	document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export const isPhone = useMediaQuery("(max-width: 600px)");
