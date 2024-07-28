import { Link, Outlet, useIsRouting, useLocation } from "@solidjs/router"
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@suid/material"
import { JSX, createMemo, For, Suspense, createSignal, createEffect } from "solid-js"
import lang from "@/lang"
import { ApiSubscription } from "@/types"
import { LoadingSuspense } from "@/components/LoadingSuspense"

export const UserCell = (props: {
	user: {
		fullName: string
		email: string
	}
}) => {
	return (
		<Stack>
			<Typography variant="body1">{props.user.fullName}</Typography>
			<Typography variant="body2" sx={{ fontSize: 14, opacity: 0.7 }}>
				{props.user.email}
			</Typography>
		</Stack>
	)
}

export const UserChip = (props: {
	user: ApiSubscription["User"]
}) => {
	return (
		<Chip
			label={<UserCell user={props.user} />}
			sx={{
				height: "auto",
				"& .MuiChip-label": {
					display: "block",
					whiteSpace: "normal",
				},
				py: 0.75,
			}}
		/>
	)
}

export const SubPageTitle = (props: {
	title: string
	right?: JSX.Element
}) => {
	return (
		<div
			style={{
				display: "flex",
				"flex-direction": "row",
				"justify-content": "space-between",
			}}
		>
			<Typography variant="h5">{props.title}</Typography>
			<div>{props.right}</div>
		</div>
	)
}

export const IsRoutingWrapper = (
	props: {
		children: JSX.Element
	}
) => {
	const isRouting = useIsRouting()

	return (
		<div style={{
			filter: isRouting() ? "blur(2px)" : "blur(0px)",
			transition: "filter 5s",
		}}>
			{props.children}
		</div>
	)
}

const AdminPage = () => {
	const isRouting = useIsRouting()

	return (
		<div>
			<Stack
				sx={{
					gap: 2,
					width: "100%",
					maxWidth: 1500,
					// center
					margin: "auto",
					padding: 2,
				}}
			>
				<AdminNavHeader />
				<Outlet />
			</Stack>
		</div>
	)
}
export default AdminPage

function AdminNavHeader() {
	const location = useLocation()
	const locationEnding = createMemo(() => {
		return location.pathname.split("/").pop()
	})

	const pages = [
		{
			name: lang.t.routeNames.adminRoutes.products(),
			path: "products",
		},
		{
			name: lang.t.routeNames.adminRoutes.payments(),
			path: "payments",
		},

		{
			name: lang.t.routeNames.adminRoutes.subscriptions(),
			path: "subscriptions",
		},
		{
			name: lang.t.routeNames.adminRoutes.vms(),
			path: "vms",
		},
		{
			name: lang.t.routeNames.adminRoutes.users(),
			path: "users",
			disabled: false,
		},
		{
			name: lang.t.routeNames.adminRoutes.ips(),
			path: "ips",
			disabled: false,
		},
		{
			name: "import",
			path: "importexistingvm",
		},
		{
			name: "templates",
			path: "templates",
		}
	]

	return (
		<Box
			sx={{
				// row
				display: "flex",
				flexDirection: "row",
				gap: 2,
			}}
		>
			<For each={pages}>{(page) => {
				return (
					<Button
						fullWidth
						disabled={page.disabled}
						LinkComponent={Link}
						variant={locationEnding() === page.path ? "contained" : "outlined"}
						href={page.path}
					>
						{page.name}
					</Button>
				)
			}}</For>
		</Box>
	)
}
