import { RemoveCircle } from "@suid/icons-material"
import { Box, IconButton, Paper, Typography } from "@suid/material"
import { createMemo, createSignal, For, onCleanup, onMount } from "solid-js"
import { createStore } from "solid-js/store"

interface Notification {
	message: string
	type: "success" | "error" | "info"
	time: number
	expire?: number
}
const Notification = (props: {
	notification: Notification
}) => {
	const [expired, setExpired] = createSignal(false)
	onMount(() => {
		setExpired(Date.now() > (props.notification.expire ?? 0))

		const timeout = setTimeout(() => {
			setExpired(true)
		}, (props.notification.expire ?? Date.now() + 100) - Date.now())

		onCleanup(() => {
			clearTimeout(timeout)
		})
	})
	const translate = createMemo(() => {
		return expired() ? "translateX(150%)" : "translateX(0px)"
	})

	return (
		<Paper
			sx={{
				backgroundColor:
					props.notification.type === "error" ? "error.main" : "success.main",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				p: 1,
				px: 2,
				transition: "all 0.5s",
				transform: translate(),
			}}
		>
			<IconButton>
				<RemoveCircle />
			</IconButton>

			<Typography variant="body2">{props.notification.message}</Typography>
		</Paper>
	)
}

const [notifications, setNotifications] = createStore<Notification[]>([])
const Notifications = () => {
	// expire notifications after time
	setInterval(() => {
		setNotifications((notifications) => {
			return notifications.filter((notification) => {
				return (notification?.expire ?? 0) + 1000 > Date.now()
			})
		})
	}, 1000)

	return (
		<Box
			sx={{
				// always bottom right
				position: "fixed",
				top: 0,
				right: 0,

				m: 4,
			}}
		>
			<For each={notifications.reverse()}>
				{(notification) => <Notification notification={notification} />}
			</For>
		</Box>
	)
}
const notify = (notification: Notification) => {
	setNotifications([
		...notifications,
		{
			...notification,
			expire: Date.now() + (notification.time ?? 5000),
		},
	])
}

export default {
	notify,
	Notifications,
}
