/* eslint-disable solid/reactivity */
import { Link, useNavigate } from "@solidjs/router";
import { Computer, SevereColdRounded } from "@suid/icons-material";
import {
	Button,
	Card,
	Chip,
	Stack,
	Typography
} from "@suid/material";
import { Show, createMemo } from "solid-js";
import lang from "@/lang";
import { ApiVirtualMachine } from "@/types";
import { EasyTable } from "../EasyTable";
import { StatusChip } from "../StatusChip";
import auth from "@/context/auth";
import { sizeBytesToHuman } from "@typevps/shared";

const VirtualMachineDetails = (props: {
	vm: ApiVirtualMachine;
}) => {
	const cpuUsage = createMemo(() => {
		const usagePercent = Math.floor(props.vm.state?.cpuUsagePercent ?? 0);
		return `${usagePercent}%`;
	});

	const ramUsage = createMemo(() => {
		const memory = props.vm.state?.memoryUsageBytes ?? 0;
		return sizeBytesToHuman(memory);
	});

	const bandwidthUsage = createMemo(() => {
		const bandwidth = 0; //vm.state?.networkUsageBytes ?? 0;
		return sizeBytesToHuman(bandwidth);
	});

	return {
		name: (
			<Stack direction="column">
				<Typography variant="body1">
					{props.vm.product.name ?? "Invalid name"}
				</Typography>
				<Typography variant="body2" color="rgba(255,255,255,0.8)">
					{props.vm.ipv4 ?? "invalid ip"}
				</Typography>

				<Stack direction="row" spacing={1} mt={1}>
					<Show
						when={props.vm.product.installStatus === "OK"}
						fallback={
							<Chip
								label={props.vm.product.installStatus}
								icon={<SevereColdRounded />}
							/>
						}
					>
						<StatusChip status={props.vm.state?.status ?? "unknown"} />
					</Show>

					<Show when={props.vm.userPaidService.isExpired}>
						<Chip label="Expired" icon={<SevereColdRounded />} />
					</Show>

					{auth.isAdmin() && <>
						<Link href={`/admin/user/${props.vm.user.id}`}>
							<Chip label={props.vm.user.name} />
						</Link>
					</>}


				</Stack>
			</Stack>
		),
		cpu: cpuUsage(),
		ram: ramUsage(),
		bandwidth: bandwidthUsage(),
		expiresOrRenewsAt: (
			<Chip
				label={lang.formatTimeLeft(props.vm.userPaidService.expiresAt, 3)}
			/>
		),
		actions: (
			<Stack direction="row" justifyContent="flex-end" spacing={1}>
				<Button
					startIcon={<Computer />}
					variant="contained"
					LinkComponent={Link}
					href={`/servers/${props.vm.id}/overview`}>
					{lang.t.goToProduct()}
				</Button>
				{/* <Button component={Link} href={`/details/${props.vm.id}/console`}>Console</Button> */}
			</Stack>
		),
		id: props.vm.id,
	};
};

export const VirtualMachineTable = (props: {
	vms?: ApiVirtualMachine[] | undefined;
	isLoading: boolean;

}) => {
	const navigate = useNavigate();

	return (
		<EasyTable
			loading={props.isLoading}
			data={props.vms?.map((vm) => VirtualMachineDetails({ vm })) ?? []}
			rows={[
				{
					key: "name",
					label: lang.t.name(),
				},
				{
					key: "cpu",
					label: lang.t.cpu(),
				},
				{
					key: "ram",
					label: lang.t.ram(),
				},
				{
					key: "bandwidth",
					label: lang.t.bandwidth(),
				},
				{
					key: "expiresOrRenewsAt",
					label: lang.t.expiresOrRenewsAt(),
				},
				{
					key: "actions",
					label: lang.t.actions(),
					align: "right",
				},
			]}
			phoneRowComponent={(row) => {
				return (
					<Card
						onClick={() => {
							navigate(`/servers/${row.id as string}/overview`);
						}}
						sx={{
							mt: 2,
							p: 2,
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						{/* this includes status etc */}
						{row.name}

						<Stack>
							<Typography>
								{lang.t.cpu()}: {row.cpu}
							</Typography>
							<Typography>
								{lang.t.ram()}: {row.ram}
							</Typography>
							<Typography>
								{lang.t.bandwidth()}: {row.bandwidth}
							</Typography>
						</Stack>
					</Card>
				);
			}}
		/>
	);
};
