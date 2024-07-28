import { Navigate, Route, Routes, useIsRouting, useLocation } from "@solidjs/router";
import {
	Grid3x3,
	Shop2,
	Storage
} from "@suid/icons-material";
import {
	JSX,
	Show,
	Suspense,
	createMemo,
	lazy
} from "solid-js";
import auth from "./context/auth";
import lang from "./lang";
import { CircularProgress, Typography } from "@suid/material";
import { LoadingSuspense } from "./components/LoadingSuspense";

const ProtectedRoute = (props: {
	component: JSX.Element | (() => JSX.Element);
	path: string;
	children?: JSX.Element | JSX.Element[];
}) => {
	const location = useLocation();
	return (
		<Route
			path={props.path}
			element={
				<Show when={auth.isLoaded()} fallback={<div>Loading...</div>}>
					<Show
						when={auth.isLoggedIn()}
						fallback={<Navigate href={`/auth?redirect=${location.pathname}`} />}
					>
						{/* also support async components */}
						{typeof props.component === "function" ? (
							<props.component />
						) : (
							props.component
						)}
					</Show>
				</Show>
			}
		>
			{props.children}
		</Route>
	);
};

export interface UiRoute {
	path: string;
	pathValidator?: string;
	name: string;
	icon: JSX.Element;
	requiredRole?: "USER" | "ADMIN";
}

export const uiRoutes = createMemo<UiRoute[]>(() => [
	{
		path: "/",
		icon: <Shop2 />,
		name: lang.t.routeNames.shop(),
	},
	{
		path: "/servers",
		icon: <Storage />,
		name: lang.t.routeNames.servers(),
		requiredRole: "USER",
		pathValidator: "/servers/**",
	},
	{
		path: "/admin",
		pathValidator: "/admin/**",
		icon: <Grid3x3 />,
		name: lang.t.routeNames.admin(),
		requiredRole: "ADMIN",
	},
]);

/*

const ProtectedRoute = (props: {
	component: Component;
	path: string;
	children?: JSX.Element | JSX.Element[];
}) => {
	const location = useLocation();
	const match = useMatch(() => props.path);

	createEffect(() => {
		if (!match()) {
			return
		}

		if (!auth.isLoaded()) {
			return
		}

		if (auth.isLoggedIn()) {
			return
		}

		window.location.href = `/auth/login?redirect=${encodeURIComponent(location.pathname)}`
	})

	return (
		<Route
			path={props.path}
			component={props.component}
		>
			{props.children}
		</Route>


	)
};

*/

export const AppRouter = () => (
	<>

		<Routes>
			<Route path="/" component={
				lazy(() => import("./pages/landing"))
			} />
			<Route path="/auth/*" component={
				lazy(() => import("./pages/auth"))
			} />

			<ProtectedRoute path="/settings" component={
				lazy(() => import("./pages/settings"))
			} />

			<ProtectedRoute path="/servers" component={
				lazy(() => import("./pages/serverList"))
			} />
			<ProtectedRoute path="/servers/:id/*" component={
				lazy(() => import("./pages/details"))
			}>


				<Route
					path="/configure"
					component={lazy(() => import("./pages/details/configure"))}
				/>


				<Route
					path="/delete"
					component={lazy(() => import("./pages/details/delete"))}
				/>


				<Route
					path="/overview"
					component={lazy(() => import("./pages/details/overview"))}
				/>

				<Route
					path="/settings"
					component={lazy(() => import("./pages/details/settings"))}
				/>

				<Route
					path="/ddos"
					component={lazy(() => import("./pages/details/ddos"))}
				/>

			</ProtectedRoute>

			<ProtectedRoute path="/admin/*" component={
				lazy(() => import("./pages/admin"))
			}>

				<Route path="/" element={<Navigate href="/admin/users" />} />

				<Route
					path="/users"
					component={lazy(() => import("./pages/admin/users"))}
				/>
				<Route
					path="/ips"
					component={lazy(() => import("./pages/admin/ips"))}
				/>
				<Route
					path="/payments"
					component={lazy(() => import("./pages/admin/payments"))}
				/>
				<Route
					path="/products"
					component={lazy(() => import("./pages/admin/products"))}
				/>
				<Route
					path="/subscriptions"
					component={lazy(() => import("./pages/admin/subscriptions"))}
				/>
				<Route
					path="/vms"
					component={lazy(() => import("./pages/admin/vms"))}
				/>
				<Route
					path="/templates"
					component={lazy(() => import("./pages/admin/templates"))}
				/>
				<Route
					path="/user/:id"
					component={lazy(() => import("./pages/admin/user"))}
				/>
				<Route
					path="/importexistingvm"
					component={lazy(() => import("./pages/admin/importExistingVm"))}
				/>
			</ProtectedRoute>

			<Route path="/tos" component={lazy(() => import("./pages/legal/tos"))} />
			<Route path="/privacy" component={lazy(() => import("./pages/legal/privacy"))} />

			<Route path="*" component={lazy(() => import("./pages/404"))} />
		</Routes>

	</>
);
