import { Accessor, JSX, createContext, createMemo, createSignal, useContext } from "solid-js";
import { ApiVirtualMachine } from "@/types";
import { Dialog, DialogTitle, Stack, DialogContent, TextField, Button } from "@suid/material";
import { trpc } from "@/trpc";
import lang from "@/lang";
import { DialogBase } from "@/components/DialogBase";
import { useVMResetPasswordDialog } from "./vmResetPassword";
import { LockReset } from "@suid/icons-material";

const ConnectionDetailsContext = createContext<{
    open: (id: string) => void,
    close: () => void,
}>()

export const VMConnectionDetailsProvider = (props: { children: JSX.Element }) => {
    const [id, setId] = createSignal<string | undefined>(undefined)
    const isOpen = createMemo(() => id() !== undefined)
    const close = () => setId(undefined)

    const vmResetPassword = useVMResetPasswordDialog()

    const loginCredentials = trpc.vms.getLoginCredentials.useQuery(
        () => ({
            id: id() ?? "",
        }),
        {
            get enabled() {
                return !!id();
            },
        },
    );

    return (
        <ConnectionDetailsContext.Provider
            value={{
                open: setId,
                close,
            }}
        >
            <DialogBase
                title={lang.t.connectionDetails()}
                open={isOpen()}
                onClose={() => setId(undefined)}
            >
                <TextField
                    label={lang.t.ipAddress()}
                    value={loginCredentials.data?.ipv4 ?? ""}
                    aria-readonly
                />
                <TextField
                    label={lang.t.username()}
                    value={loginCredentials.data?.username ?? ""}
                    aria-readonly
                />
                <TextField
                    label={lang.t.rootPassword()}
                    value={loginCredentials.data?.password ?? ""}
                    aria-readonly
                />
                <Button
                    startIcon={
                        <LockReset />
                    }
                    variant="contained"
                    color="error"
                    onClick={() => {
                        vmResetPassword.open(id() ?? '', loginCredentials.data?.username ?? '')
                        close()

                    }}>
                    {lang.t.resetPassword()}
                </Button>
            </DialogBase>
            {props.children}
        </ConnectionDetailsContext.Provider>
    )
}

export const useVMConnectionDetailsDialog = () => {
    const context = useContext(ConnectionDetailsContext)
    if (!context) {
        throw new Error(
            "useConnectionDetailsDialog must be used within a ConnectionDetailsProvider",
        )
    }
    return context
}