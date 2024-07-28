import {
	Box,
	Button,
	ButtonGroup,
	Card,
	CardContent,
	CardHeader,
	Grid,
	LinearProgress,
	Paper,
	Stack,
	Typography
} from "@suid/material";
import { SolidApexCharts } from "solid-apexcharts";
import { JSX, createMemo, createSignal } from "solid-js";
import lang from "@/lang";
import { trpc } from "@/trpc";
import { ApiVirtualMachine, ApiVirtualMachineS } from "@/types";
import { getCookie, roundPrecision } from "../../utils";
import { CreateSubPageState } from "./base";
import { Launch, Link } from "@suid/icons-material";
import { config } from "@/context/config";
import { COOKIES } from "@/context/auth";
import { sizeBytesToHuman } from "@typevps/shared";



const Graph = (props: {
	vm: ApiVirtualMachineS;
}) => {
	const [type, setType] = createSignal<"cpu" | "ram" | "disk">("cpu");
	const [period, setPeriod] = createSignal<"hour" | "day" | "week" | "month">(
		"hour",
	);

	const graphData = trpc.vms.graph.useQuery(
		() => {
			return {
				id: props.vm.id,
				timeframe: period(),
			};
		},
		{
			suspense: false,
			//refetchInterval: 60_000,
		},
	);

	// find max ram
	const maxValue = createMemo(() => {
		if (type() === "cpu") {
			return 100;
		}

		return Math.max(
			...(graphData.data?.map((x) => {
				if (type() === "ram") {
					return (
						(x.maxmem ?? props.vm.state.memoryMaxBytes / 1024 / 1024) /
						1024 /
						1024
					);
				}
				if (type() === "disk") {
					return (x.maxdisk ?? 0) / 1024 / 1024;
				}
				return 0;
			}) ?? [0]),
		);
	});

	const minValue = createMemo(() => {
		return 0;
	});

	const options = createMemo(() => {
		return {
			chart: {
				background: "transparent",
				animations: {
					enabled: false,
				},
				type: "area",
			},
			xaxis: {
				categories: graphData.data?.map((x) => {
					const date = new Date(x.time * 1000);

					if (period() === "hour") {
						return `${date.toLocaleTimeString()}`;
					}

					if (period() === "day") {
						return `${date.toLocaleTimeString()}`;
					}
				}),
				axisTicks: 10,
				tickAmount: 10,
			},
			yaxis: {
				max: maxValue(),
				min: minValue(),
			},
			// make sure the text dont overlap

			theme: {
				mode: "dark",
			},
			//dont show the labels on axis
			dataLabels: {
				enabled: false,
			},

			// disable grid
			grid: {
				show: false,
			},
		} as ApexCharts.ApexOptions;
	});
	const series = createMemo(() => {
		if (type() === "cpu") {
			return [
				{
					name: "CPU Usage",
					data:
						graphData.data?.map((x) => {
							// limit to 2 decimal places
							return roundPrecision((x?.cpu ?? 0) * 100, 2);
						}) ?? [],
				},
			];
		}

		if (type() === "ram") {
			return [
				{
					name: "RAM Usage (MB)",
					data:
						graphData.data?.map((x) => {
							return roundPrecision((x?.mem ?? 0) / 1024 / 1024, 2);
						}) ?? [],
				},
			];
		}

		if (type() === "disk") {
			return [
				{
					name: "Disk Usage (MB)",
					data:
						graphData.data?.map((x) => {
							return roundPrecision((x?.disk ?? 0) / 1024 / 1024, 2);
						}) ?? [],
				},
			];
		}

		return [];
	});

	const title = createMemo(() => {
		if (type() === "cpu") {
			return {
				title: "CPU Usage",
				subtitle: `CPU usage over the last ${period()}`,
			};
		}

		if (type() === "ram") {
			return {
				title: "RAM Usage",
				subtitle: `RAM usage over the last ${period()}`,
			};
		}

		if (type() === "disk") {
			return {
				title: "Disk Usage",
				subtitle: `Disk usage over the last ${period()}`,
			};
		}

		throw new Error("Invalid type");
	});
	return (
		<Card>
			<CardHeader
				title={title().title}
				subheader={<Typography variant="body2">{title().subtitle}</Typography>}
				action={
					<Stack gap={1}>
						<ButtonGroup>
							<Button
								onClick={() => setType("cpu")}
								variant={type() === "cpu" ? "contained" : "outlined"}
							>
								{lang.t.cpu()}
							</Button>
							<Button
								onClick={() => setType("ram")}
								variant={type() === "ram" ? "contained" : "outlined"}
							>
								{lang.t.ram()}
							</Button>
							<Button
								onClick={() => setType("disk")}
								variant={type() === "disk" ? "contained" : "outlined"}
							>
								{lang.t.disk()}
							</Button>
						</ButtonGroup>

						<ButtonGroup size="small">
							{/* period switcher */}
							<Button
								onClick={() => setPeriod("hour")}
								variant={period() === "hour" ? "contained" : "outlined"}
							>
								{lang.t.hour()}
							</Button>
							<Button
								onClick={() => setPeriod("day")}
								variant={period() === "day" ? "contained" : "outlined"}
							>
								{lang.t.day()}
							</Button>
							<Button
								onClick={() => setPeriod("week")}
								variant={period() === "week" ? "contained" : "outlined"}
							>
								{lang.t.week()}
							</Button>
						</ButtonGroup>
					</Stack>
				}
			/>
			<CardContent>
				<SolidApexCharts
					width="100%"
					height="400px"
					type="area"
					options={options()}
					series={series()}
				/>
			</CardContent>
		</Card>
	);
};
const BasicOverviewItem = (props: {
	title: string;
	usage: number;
	max: number;
	details?: JSX.Element;
}) => (
	<Grid item xs={12} md={6}>
		<Paper sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
			<Stack direction="row" justifyContent="space-between">
				<Typography variant="h4">{props.title}</Typography>

				<Typography variant="h4">
					{Math.floor((props.usage / props.max) * 100)}%
				</Typography>
			</Stack>
			<LinearProgress
				variant="determinate"
				value={(props.usage / props.max) * 100}
			/>
			{props.details && (
				<Stack direction="row" justifyContent="space-between">
					{props.details}
				</Stack>
			)}
		</Paper>
	</Grid>
);

const RemoteConnection = (props: { vm: ApiVirtualMachine }) => {
	const [isEnabled, setIsEnabled] = createSignal(false);
	const url = createMemo(() => {
		const accessToken = getCookie(COOKIES.ACCESS_TOKEN)

		return `${config.vncProxyHost}?autoconnect=true&accessToken=${accessToken}&dbVmId=${props.vm.id}`
	})

	return (
		<Grid item xs={12}>
			<Paper sx={{
				position: 'relative',

				aspectRatio: '16/10',
			}}>
				{
					isEnabled() && <iframe
						src={url()}
						style={{ width: '100%', height: '100%', position: 'absolute', border: 'none' }}
						// allow fullscreen
						allowfullscreen
					/>
				}

				<Box sx={{
					position: 'absolute',
					// center
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					gap: 1,

					flexDirection: 'column',
					justifyContent: 'center',
					display: isEnabled() ? 'none' : 'flex',
				}}>
					<Typography variant="h4">
						Remote Console (VNC)
					</Typography>
					<Stack direction="row" justifyContent="center" gap={1}>
						<Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={() => setIsEnabled(true)}>
							Connect
						</Button>
						<Button variant="outlined" color="primary" href={url()} target="_blank">
							<Launch />
						</Button>
					</Stack>
				</Box>
			</Paper>

		</Grid>
	)
}

const BasicOverview = (props: { vm: ApiVirtualMachineS }) => {
	return (
		<Grid container spacing={2}>
			{/* 			<Grid item xs={12} md={2}>
				<Paper
					sx={{
						p: 2,
						display: "flex",
						flexDirection: "column",
						gap: 1,
						height: 100,
					}}
				>
					<Typography variant="body1" textAlign="center">
						{lang.t.cpu()}
					</Typography>
					<Typography variant="h4" textAlign="center">
						{roundPrecision(props.vm.state.cpuUsagePercent, 2)}%
					</Typography>
				</Paper>
			</Grid> */}

			<BasicOverviewItem
				title={lang.t.cpuUsage()}
				usage={roundPrecision(props.vm.state.cpuUsagePercent, 2)}
				max={100}
				details={<>
					<Typography variant="body2">
						{roundPrecision(props.vm.state.cpuUsagePercent, 2)} of {props.vm.product.cpuCores} cores
					</Typography>
				</>}

			/>

			<BasicOverviewItem
				title={lang.t.memoryUsage()}
				usage={props.vm.state.memoryUsageBytes}
				max={props.vm.state.memoryMaxBytes}
				details={<>
					<Typography variant="body2">
						{lang.t.xOfxUsed({
							total: sizeBytesToHuman(props.vm.state.memoryMaxBytes),
							used: sizeBytesToHuman(props.vm.state.memoryUsageBytes),
						})}
					</Typography>
					<Typography variant="body2">
						{lang.t.xFree({
							free: sizeBytesToHuman(props.vm.state.memoryMaxBytes - props.vm.state.memoryUsageBytes),
						})}
					</Typography>
				</>}
			/>

			<RemoteConnection vm={props.vm} />

		</Grid>
	);
};

const VPSOverviewPage = CreateSubPageState((props) => {
	return (
		<>
			{/* <Overview vm={props.vm} /> */}
			<BasicOverview vm={props.vm} />
			{/* <Graph vm={vm} /> */}
		</>
	);
});

export default VPSOverviewPage;

