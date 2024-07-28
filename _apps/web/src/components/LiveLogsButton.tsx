import { Paper, Stack, Typography } from "@suid/material";
import { LoadingButton } from "./LoadingButton";
import {
    ApiSetupLogMessage
} from "@/types";
import { createEffect, createMemo } from "solid-js";
import lang from "@/lang";
import { trpc } from "@/trpc";
import { liveLogs } from "@typevps/api/src/liveLogger";

const Log = (props: { log: ApiSetupLogMessage }) => {
    const statusIcon = createMemo(() => {
        if (props.log.status === "ok") {
            return "✅";
        }
        if (props.log.status === "error") {
            return "❌";
        }
        return "⏳";
    });

    return (
        <Typography variant="body2" width="100%">
            {lang.formatTime(props.log.date)} - {props.log.message} - {statusIcon()}
        </Typography>
    );
};

export const LiveLogsButton = (props: {
    onClick?: () => void;
    loading: boolean;
    liveLogId: string | undefined;
    label: string;
    disabled?: boolean;
    variant?: "contained" | "outlined";
    onSuccess?: () => void;
    onError?: () => void;
}) => {
    const livelogs = trpc.vmInstall.liveLogs.useQuery(() => ({
        liveLogId: props.liveLogId ?? '',
    }), {
        get enabled() {
            return !!props.liveLogId
        },
        refetchInterval: 250
    });
    const isLiveLogging = createMemo(() => {
        return !!props.liveLogId && livelogs.data?.status === 'working';
    });

    const paperRef: HTMLDivElement | undefined = undefined;
    setInterval(() => {
        if (paperRef && isLiveLogging()) {
            paperRef.scrollTop = paperRef.scrollHeight;
        }
    }, 100);

    createEffect(() => {
        if (livelogs.data?.status === 'success') {
            props.onSuccess?.();
        }

        if (livelogs.data?.status === 'failed') {
            props.onError?.();
        }
    });

    return (
        <Stack gap={1}>
            <LoadingButton
                disabled={props.disabled || isLiveLogging()}
                onClick={props.onClick}
                loading={props.loading || isLiveLogging()}
                fullWidth
                variant={props.variant ?? "contained"}
                type="submit"
            >
                {props.label}
            </LoadingButton>

            <Paper
                ref={paperRef}
                sx={{
                    borderRadius: 2,
                    p: 2,
                    maxHeight: "300px",
                    overflowY: "auto",
                    // animate in when there are logs
                    transition: "opacity 0.2s ease-in-out",
                    opacity: livelogs.data?.messages ? 1 : 0,
                }}
            >
                {livelogs.data?.messages?.map((log) => (
                    <Log log={log} />
                ))}

            </Paper>
        </Stack>
    )
}