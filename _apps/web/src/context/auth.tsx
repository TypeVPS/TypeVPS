import { useLocation, useNavigate } from "@solidjs/router";
import { PubJwtData } from "@typevps/api/src/router/auth";
import { createEffect, createMemo, createSignal } from "solid-js";
import { trpcBase } from "@/trpc";
import { getCookie } from "../utils";

export const COOKIES = {
	IS_LOGGED_IN: "PS_IS_LOGGED_IN",
	REFRESH_TOKEN: "PS_REFRESH_TOKEN",
	ACCESS_TOKEN: "PS_ACCESS_TOKEN",
};

const [userData, setUserData] = createSignal<PubJwtData | undefined>(undefined);
const isLoggedIn = createMemo(() => userData() !== undefined);
const [isLoaded, setIsLoaded] = createSignal(false);
const updateJwtFromCookie = () => {
	const jwt = getCookie(COOKIES.ACCESS_TOKEN);
	if (!jwt) {
		setUserData(undefined);
		return;
	}

	// parse jwt
	const jwtData = JSON.parse(atob(jwt.split(".")[1])) as PubJwtData;
	setUserData(jwtData);
};

const refresh = async () => {
	const isLoggedIn = getCookie(COOKIES.IS_LOGGED_IN);
	if (!isLoggedIn) {
		console.trace("not logged in");
		setUserData(undefined);
		return;
	}

	// refresh
	await trpcBase.auth.refresh.mutate().catch(trpcBase.auth.logout.mutate).finally(() => {
		updateJwtFromCookie();
	});
};

// eslint-disable-next-line @typescript-eslint/require-await
const load = async () => {
	refresh().finally(() => {
		setIsLoaded(true);
	});
};

export const useRedirectWhenLoggedIn = () => {
	const location = useLocation<{
		redirect?: string;
	}>();
	const navigate = useNavigate();

	createEffect(() => {
		if (isLoggedIn()) {
			const redirect = location?.state?.redirect ?? "/";
			if (redirect) {
				navigate(redirect);
			}
		}
	});
};

const hasRole = (role: "ADMIN" | "USER") => {
	return userData()?.roles.includes(role);
};

const isAdmin = createMemo(() => {
	return hasRole("ADMIN");
});

export default {
	isLoggedIn,
	isLoaded,
	load,
	userData,
	isAdmin,
	updateJwtFromCookie,
	hasRole,
};
