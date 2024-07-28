import {
	createChainedI18n
} from "@solid-primitives/i18n";
import { en } from "./en";
import { da } from "./da";

const dictionaries = {
	en,
	da,
};
type Language = keyof typeof dictionaries;

const validateLocale = (locale: string): Language => {
	if (locale in dictionaries) {
		return locale as Language;
	}

	return "en";
};

export const [t, opts] = createChainedI18n({
	dictionaries,
	locale: validateLocale(localStorage.getItem("locale") || "en"),
});

export const setLocale = (locale: Language) => {
	// save directly to localStorage
	localStorage.setItem("locale", opts.locale());

	opts.setLocale(locale);
};

export const getIntlLocale = () => {
	switch (opts.locale()) {
		case "da":
			return "da-DK";
		case "en":
		default:
			return "en-US";
	}
}