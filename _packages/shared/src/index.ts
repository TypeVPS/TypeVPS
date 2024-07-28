export * as zod from "./zod";
export * from "./types";


export const sizeBytesToHuman = (bytes: number | undefined) => {
	const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	if(!bytes) {
		return "0 B";
	}

	let l = 0;
	let n = bytes;

	while (n >= 1024 && ++l) {
		n = n / 1024;
	}

	return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
};

// big int to human readable
export const sizeBytesToHumanBigInt = (bytes: bigint) => {
	const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	let l = 0;
	let n = bytes;

	while (n >= 1024n && ++l) {
		n = n / 1024n;
	}

	return `${n.toString()} ${units[l]}`;
};