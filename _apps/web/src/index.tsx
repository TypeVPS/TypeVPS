/* @refresh reload */
import { Router } from "@solidjs/router";
import { CssBaseline, ThemeProvider, createTheme } from "@suid/material";
import { render } from "solid-js/web";
import { Header } from "./components/Header";
import Notifications from "./components/Notifications";
import { SidebarNew } from "./components/SideBarNew";
import auth from "./context/auth";
import { ConfigProvider } from "./context/config";
import "./index.css";
import { AppRouter } from "./router";
import { ApiProvider } from "./trpc";
import { LiveChat } from "./components/LiveChat";
import { JSX } from "solid-js";
import { VMResetPasswordProvider } from "./dialog/vmResetPassword";
import { VMConnectionDetailsProvider } from "./dialog/vmConnectionDetails";
import { BuyContextProvider } from "./components/Shopping";
import { AdminCreateTemplateProvider } from "./pages/admin/templates";

const theme = createTheme({
	palette: {
		mode: "dark",
		primary: {
			main: "rgba(255, 255, 255, 0.94)",
		},
		background: {
			paper: "rgba(30, 30, 30, 1)",
		},
		//background: {
		//paper: "rgba(10, 10, 10, 0.94)",
		//},
		/* 	primary: {
			main: "rgba(10, 10, 10, 0.94)",
			contrastText: "rgba(255, 255, 255, 0.94)",
		}, */
	},
	typography: {
		h1: {
			fontSize: "3rem",
			"@media (max-width:600px)": {
				fontSize: "2.25rem", // 25% smaller font size on phone
			},
		},
		h2: {
			fontSize: "2rem",
			"@media (max-width:600px)": {
				fontSize: "1.5rem", // 25% smaller font size on phone
			},
		},
		h3: {
			fontSize: "1.75rem",
			"@media (max-width:600px)": {
				fontSize: "1.3125rem", // 25% smaller font size on phone
			},
		},
		h4: {
			fontSize: "1.5rem",
			"@media (max-width:600px)": {
				fontSize: "1.125rem", // 25% smaller font size on phone
			},
		},
		h5: {
			fontSize: "1.25rem",
			"@media (max-width:600px)": {
				fontSize: "0.9375rem", // 25% smaller font size on phone
			},
		},
	},
	components: {
		MuiButton: {
			defaultProps: {},
		},
	},
});

const AdminDialogProvider = (props: { children: JSX.Element }) => {
	return <>
		<AdminCreateTemplateProvider>
			{props.children}
		</AdminCreateTemplateProvider>
	</>
}

const DialogProvider = (props: { children: JSX.Element }) => {
	return <>
		<BuyContextProvider>
			<VMResetPasswordProvider>
				<VMConnectionDetailsProvider>

					{props.children}

				</VMConnectionDetailsProvider>
			</VMResetPasswordProvider>
		</BuyContextProvider>
	</>
}

const _App = () => {
	void auth.load();

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />

			<Notifications.Notifications />
			<ApiProvider>
				<ConfigProvider>


					<Router >
						<AdminDialogProvider>
							<DialogProvider>

								<LiveChat />
								<Header />

								<SidebarNew>
									<AppRouter />
								</SidebarNew>
							</DialogProvider>
						</AdminDialogProvider>
					</Router>
				</ConfigProvider>
			</ApiProvider>
		</ThemeProvider>
	);
};

const root = document.getElementById("root")
if (!root) throw new Error("No root element")

render(() => <_App />, root);
