import { Link, useParams, useSearchParams } from "@solidjs/router"
import { DialogBase } from "../DialogBase"
import { createMemo } from "solid-js"
import { trpc } from "@/trpc"
import { Button, CircularProgress, Divider, Typography } from "@suid/material"
import { createSignal } from "solid-js"
import { AutoRenewSwitch, MorePaymentProvidersByDisablingAutoRenew, PaymentProviders } from "./Components"
import lang from "@/lang"
import auth from "@/context/auth"

export const BuyNewDialog = () => {
    // get selected product id from params
    const [searchParams, setSearchParams] = useSearchParams()
    const productId = createMemo(() => searchParams.buyProductId)
    const product = trpc.products.get.useQuery(() => ({
        id: productId()
    }), {
        get enabled() {
            return productId() !== undefined
        }
    })

    const [autoRenew, setAutoRenew] = createSignal(true)

    return (
        <DialogBase
            title={lang.t.buyX({
                x: product.data?.name ?? ""
            })}
            titleDetails={product.data?.description}
            open={productId() !== undefined}
            onClose={() => {
                setSearchParams({
                    buyProductId: undefined
                })
            }}
        >
            {product.isLoading && <CircularProgress />}
            {product.data && auth.isLoggedIn() && (
                <>
                    <AutoRenewSwitch
                        autoRenew={autoRenew()}
                        setAutoRenew={setAutoRenew}
                    />

                    <Divider />

                    <PaymentProviders
                        productId={productId()}
                        autoRenew={autoRenew()}
                        price={product.data.monthlyPrice}
                    />
                    <MorePaymentProvidersByDisablingAutoRenew autoRenew={autoRenew()} />
                </>
            )}
            {product.data && !auth.isLoggedIn() && (
                <Button variant="contained" color="primary" href={`/auth?redirect=/?buyProductId=${productId()}`} LinkComponent={Link}>
                    {lang.t.loginToContinue()}
                </Button>
            )}

        </DialogBase>
    )
}