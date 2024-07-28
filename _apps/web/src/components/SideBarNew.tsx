import { useMatch, useNavigate } from "@solidjs/router";
import { Settings } from "@suid/icons-material";
import {
	Button,
	Drawer,
	List,
	ListItem,
	Stack,
	Typography,
	useMediaQuery,
} from "@suid/material";
import { JSX, createMemo, createSignal, For } from "solid-js";
import auth from "@/context/auth";
import lang from "@/lang";
import { UiRoute, uiRoutes } from "../router";
import { isPhone } from "../utils";
import { Logo } from "./Logo";

const SideBarItem = (props: {
	route: UiRoute;
	iconsOnly?: boolean;
}) => {
	const match = useMatch(() => props.route.pathValidator ?? props.route.path);
	const navigate = useNavigate();

	return (
		<ListItem>
			<Button
				sx={{
					justifyContent: props.iconsOnly ? "center" : "flex-start",
					px: 2,
					gap: 2,
					width: props.iconsOnly ? "50px" : "190px",
					height: props.iconsOnly ? "50px" : "50px",
					transition: "all 0.4s ease-in-out",
					justifySelf: "center"
				}}
				size="large"
				fullWidth
				variant={match() ? "contained" : "text"}
				onClick={() => {
					navigate(props.route.path);
				}}
			>
				{props.route.icon}
				{!props.iconsOnly && <Typography
					sx={{
						opacity: props.iconsOnly ? 0 : 1,
						transition: "opacity 0.5s ease-in-out",
					}}
				>
					{props.route.name}
				</Typography>}
			</Button>
		</ListItem>
	);
};

export const SidebarNew = (props: {
	children?: JSX.Element | JSX.Element[];
}) => {
	const [open, setOpen] = createSignal(true);

	const toggleDrawer = () => {
		setOpen(!open());
	};

	const iconOnly_ = useMediaQuery("(max-width: 1000px)");
	const iconOnly = createMemo(() => !isPhone() && iconOnly_());

	const uiRoutesFiltered = createMemo(() => {
		return uiRoutes().filter((route) => {
			if (route.requiredRole && !auth.isLoggedIn()) {
				return false;
			}

			if (route.requiredRole && !auth.hasRole(route.requiredRole)) {
				return false;
			}

			return true;
		});
	});

	return (
		<>
			{auth.isLoggedIn() && <Drawer
				anchor="left"
				open={open()}
				onClose={toggleDrawer}
				variant={isPhone() ? "temporary" : "permanent"}
			>
				{!iconOnly() && (
					<Stack alignItems="center" justifyContent="center" mt={2}>
						<Logo style={{ width: "120px" }} />
						<Typography variant="h6" component="h1">
							{lang.t.productName()}
						</Typography>
					</Stack>
				)}

				<List>
					<For each={uiRoutesFiltered()}>{(route) => (
						<SideBarItem route={route} iconsOnly={iconOnly()} />
					)}</For>
				</List>

				<div
					style={{
						"flex-grow": 1,
					}}
				/>

				{/* settings */}
				{auth.isLoggedIn() && (
					<SideBarItem
						route={{
							icon: <Settings />,
							name: lang.t.routeNames.settings(),
							path: "/settings",
						}}
						iconsOnly={iconOnly()}
					/>
				)}
			</Drawer>}

			<div
				style={{
					"margin-left": (isPhone() || !auth.isLoggedIn()) ? "0px" : iconOnly() ? "100px" : "220px",
				}}
			>
				{props.children}
			</div>
		</>
	);
};
