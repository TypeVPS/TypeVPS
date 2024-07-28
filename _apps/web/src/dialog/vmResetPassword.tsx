import { Accessor, JSX, createContext, createMemo, createSignal, useContext } from "solid-js";
import { ApiVirtualMachine } from "@/types";
import { Button, Dialog, DialogTitle, Stack, TextField } from "@suid/material";
import { DialogBase } from "@/components/DialogBase";
import { PasswordInputWithGenerate } from "@/components/PasswordWithGenerate";
import { createForm } from "@felte/solid";
import { z } from "zod";
import { validator } from "@felte/validator-zod";
import { trpc } from "@/trpc";
import { LoadingButton } from "@/components/LoadingButton";
import lang from "@/lang";
import { notifyManager } from "@tanstack/solid-query";
import Notifications from "@/components/Notifications";

const ResetVMPasswordContext = createContext<{
    open: (vm: string, osUsername: string) => void,
}>()
export const VMResetPasswordProvider = (props: { children: JSX.Element }) => {
    const [vmId, setVmId] = createSignal<string | undefined>(undefined)
    const [osUsername, setOsUsername] = createSignal<string | undefined>(undefined)
    const isOpen = createMemo(() => vmId() !== undefined)

    const resetPasswordMutation = trpc.agent.setPassword.useMutation({
        onSuccess: () => {
            form.reset()
            setVmId(undefined)
            setOsUsername(undefined)

            Notifications.notify({
                message: 'Password reset successfully',
                type: 'success',
                time: 5000,
            })
        }
    })

    const schema = z.object({
        password: z.string()
    })
    type Schema = z.infer<typeof schema>
    const form = createForm<Schema>({
        extend: [validator({ schema, level: "error" })],
        onSubmit: (values) => {
            const vmId_ = vmId()
            const osUsername_ = osUsername()
            if (!vmId_ || !osUsername_) {
                throw new Error("VM id or osUsername is undefined")
            }

            return resetPasswordMutation.mutate({
                id: vmId_,
                osUsername: osUsername_,
                password: values.password,
            })
        },
    })

    return (
        <ResetVMPasswordContext.Provider
            value={{
                open: (vm: string, osUsername: string) => {
                    setVmId(vm)
                    setOsUsername(osUsername)
                },
            }}
        >
            <DialogBase
                title={lang.t.resetPasswordForX({
                    x: osUsername() ?? ''
                })}
                open={isOpen()}
                onClose={() => setVmId(undefined)}
                ref={form.form}
            >
                <PasswordInputWithGenerate generateOnMount={true} label="New password" name="password" />
                <LoadingButton
                    loading={resetPasswordMutation.isLoading}
                    variant="contained"
                    type="submit">
                    Reset
                </LoadingButton>
            </DialogBase>

            {props.children}
        </ResetVMPasswordContext.Provider>
    )
}

export const useVMResetPasswordDialog = () => {
    const context = useContext(ResetVMPasswordContext)
    if (!context) {
        throw new Error(
            "useResetVMPasswordDialog must be used within a ResetVMPasswordProvider",
        )
    }
    return context
}