import { useLocation, useNavigate, useParams, useSearchParams } from "@solidjs/router"
import { DialogBase } from "../DialogBase"
import { For, createMemo } from "solid-js"
import { trpc } from "@/trpc"
import { CircularProgress, Divider, Typography } from "@suid/material"
import { createSignal } from "solid-js"
import { AutoRenewSwitch, MorePaymentProvidersByDisablingAutoRenew, PaymentProviders } from "./Components"
import lang from "@/lang"

export const ExtendUserServiceDialog = () => {
    // get selected service id from params
    const [searchParams, setSearchParams] = useSearchParams()
    const userServiceId = createMemo(() => searchParams.extendUserPaidServiceId)
    const userService = trpc.userPaidServices.get.useQuery(() => ({
        id: userServiceId()
    }), {
        get enabled() {
            return userServiceId() !== undefined
        }
    })

    const [autoRenew, setAutoRenew] = createSignal(true)

    return (
        <DialogBase
            title={lang.t.extend()}
            open={userServiceId() !== undefined}
            onClose={() => {
                setSearchParams({
                    extendUserPaidServiceId: undefined
                })
            }}
        >
            {userService.isLoading && <CircularProgress />}
            {userService.data && (
                <>
                    <For each={userService.data.services}>{(service) => {
                        return (
                            <Typography variant="body1">
                                {service.description}
                            </Typography>
                        );
                    }}</For>


                    <AutoRenewSwitch
                        autoRenew={autoRenew()}
                        setAutoRenew={setAutoRenew}
                    />

                    <Divider />

                    <PaymentProviders
                        existingUserPaidServiceId={userServiceId()}
                        autoRenew={autoRenew()}
                        price={userService.data.monthlyPrice}
                    />
                    <MorePaymentProvidersByDisablingAutoRenew autoRenew={autoRenew()} />
                </>
            )}

        </DialogBase>
    )
}