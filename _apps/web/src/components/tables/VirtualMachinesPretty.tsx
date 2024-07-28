import { Button, Paper, Stack, Typography } from "@suid/material";
import { ApiVirtualMachine } from "@/types";
import { For, JSX } from "solid-js";
import { Computer, DeveloperBoard, Dns, HourglassTop, Launch, Memory, QueryBuilder } from "@suid/icons-material";
import { roundPrecision } from "../../utils";
import { StatusChip } from "../StatusChip";
import lang from "@/lang";
import { Link } from "@solidjs/router";
import { sizeBytesToHuman } from "@typevps/shared";
import { VirtualMachineTable } from "./VirtualMachines";

const InfoStack = (props: {
    value: string | number | undefined;
    icon: JSX.Element
    subValue?: string | number | undefined;
}) => {
    return <Stack
        sx={{
            width: 60
        }}
        direction="column"
        spacing={1}
        alignItems="center"

    >
        {props.icon}
        <Typography variant="body2">
            {props.value}
        </Typography>
        {/*         <Typography variant="body2" color="text.secondary" textAlign="center">
            {props.subValue}
        </Typography> */}
    </Stack>
}


const VirtualMachineDetails = (props: {
    vm: ApiVirtualMachine;
}) => {
    return <Paper sx={{
        p: 2,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    }}>
        {/* left */}
        <Stack direction="row" spacing={4} alignItems="center">
            <Stack gap={0.5} direction="column" justifyContent="center">
                <Typography variant="h6">
                    {props.vm.product.name}
                </Typography>
                <StatusChip status={props.vm.state?.status} size="small" />
            </Stack>


            {/* ip address */}
            <InfoStack
                icon={<Dns />}
                value={props.vm.ipv4}
            />

            {/* time left */}
            <InfoStack
                icon={<QueryBuilder />}
                value={lang.formatTimeLeft(
                    props.vm.userPaidService.expiresAt,
                    1,
                )}
                subValue={props.vm.userPaidService.autoRenews ? 'auto renews' : undefined} />

        </Stack>


        {/* right */}
        <Stack direction="row" spacing={2} alignItems="center">


            {/* CPU Usage */}
            <InfoStack
                icon={<DeveloperBoard />}
                value={sizeBytesToHuman(props.vm.state?.memoryUsageBytes)}
            />

            {/* RAM Usage */}
            <InfoStack
                icon={<Memory />}
                value={roundPrecision(props.vm.state?.cpuUsagePercent ?? 0, 2)}
            />




            {/* goto */}
            <Button startIcon={<Computer />} variant="contained" LinkComponent={Link} href={`/servers/${props.vm.id}/overview`}>
                {lang.t.goToProduct()}
            </Button>


        </Stack>
    </Paper >
}

export const VirtualMachineTablePretty2 = (props: {
    vms?: ApiVirtualMachine[] | undefined;
    isLoading: boolean;

}) => {
    return <Stack
        direction="column"
        spacing={1}
    >
        <For each={props.vms ?? []}>
            {vm => <VirtualMachineDetails vm={vm} />}
        </For>

    </Stack>
}

export const VirtualMachineTablePretty = VirtualMachineTable