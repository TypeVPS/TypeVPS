import { t, setLocale, opts } from "./locale";
import { formatCurrency, formatDate, formatDateTime, formatTime, formatTimeLeft } from "./utils";

export default {
	t: t,
	formatCurrency: formatCurrency,
	formatDate: formatDate,
	formatDateTime: formatDateTime,
	formatTime: formatTime,
	formatTimeLeft: formatTimeLeft,
	setLocale: setLocale,
	locale: opts.locale

};