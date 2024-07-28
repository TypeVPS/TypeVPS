import { createSignal } from "solid-js";
import { config } from "@/context/config";
import { getIntlLocale, getSelectedLanguageOptions } from "./locale";

export const formatTimeLeft = (time: Date | null, maxLevels: number) => {
	if (!time) {
		return "0";
	}

	const diff = time.getTime() - Date.now();
	let timeLeft = diff;
	let out = "";

	for (let i = 0; i < maxLevels; i++) {
		const seconds = Math.floor(timeLeft / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) {
			out += `${days}d`;
			timeLeft -= days * 24 * 60 * 60 * 1000;
		} else if (hours > 0) {
			out += `${hours}h`;
			timeLeft -= hours * 60 * 60 * 1000;
		} else if (minutes > 0) {
			out += `${minutes}m`;
			timeLeft -= minutes * 60 * 1000;
		} else if (seconds > 0) {
			out += `${seconds}s`;
			timeLeft -= seconds * 1000;
		} else {
			break;
		}

		if (i < maxLevels - 1) {
			out += " ";
		}
	}

	return out;
};

export const formatCurrency = (amount: number) => {
	const originalCurrencyFormat = new Intl.NumberFormat(getIntlLocale(), {
		style: "currency",
		currency: config.currency,
		// don't show decimals if they are 0
		minimumFractionDigits: 0,
	}).format(amount);

	return originalCurrencyFormat
};

export const formatDateTime = (date: Date | null) => {
	if (!date) return "N/A";

	return new Intl.DateTimeFormat(getIntlLocale(), {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
	}).format(date);
};

export const formatDate = (date: Date | undefined | null) => {
	if (!date) return "N/A";
	return new Intl.DateTimeFormat(getIntlLocale(), {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
};

export const formatTime = (date: Date | undefined | null) => {
	if (!date) return "N/A";

	return new Intl.DateTimeFormat(getIntlLocale(), {
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
	}).format(date);
};
