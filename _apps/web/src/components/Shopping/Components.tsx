import { trpc } from "@/trpc";
import { For, Show, createMemo } from "solid-js";
import { LoadingButton } from "../LoadingButton";
import lang from "@/lang";
import { Stack, Typography } from "@suid/material";
import { Switch as MuiSwitch } from "@suid/material";

const paymentProviders = [
    {
        name: "Stripe",
        shortDescription: "Pay with your credit card",
        icon: "https://stripe.com/img/v3/home/social.png",
        provider: "STRIPE" as const,
        type: "CARD" as const,
        displayName: "Card",
        autoRenewSupported: true,
    },
    {
        name: "Coinbase",
        shortDescription: "Pay with your Coinbase account",
        autoRenewSupported: false,
        provider: "COINBASE_COMMERCE" as const,
        type: "CRYPTO" as const,
        displayName: "Crypto",
    },
];

export const PaymentProvider = (props: {
    provider: typeof paymentProviders[0];
    autoRenew: boolean;
    productId?: string;
    existingUserPaidServiceId?: string;
    price: number;
}) => {
    const subscriptionMutation = trpc.subscriptions.order.useMutation({
        onSuccess: (data) => {
            window.location.href = data.providerPaymentUrl;
        },
    });

    const paymentMutation = trpc.payments.order.useMutation({
        onSuccess: (data) => {
            window.location.href = data.providerPaymentUrl;
        },
    });

    return (
        <Show
            when={
                !props.autoRenew ||
                (props.autoRenew && props.provider.autoRenewSupported)
            }
        >
            <LoadingButton
                disabled={props.autoRenew && !props.provider.autoRenewSupported}
                loading={paymentMutation.isLoading || subscriptionMutation.isLoading}
                onClick={() => {
                    const opts = {
                        productId: props.productId,
                        existingUserPaidServiceId: props.existingUserPaidServiceId,
                        paymentProvider: props.provider.provider,
                    };

                    if (props.autoRenew) {
                        subscriptionMutation.mutate(opts);
                    } else {
                        paymentMutation.mutate(opts);
                    }
                }}
                variant="contained"
            >
                {props.provider.displayName} - {lang.formatCurrency(props.price)}
            </LoadingButton>
        </Show>
    );
};

export const PaymentProviders = (props: {
    existingUserPaidServiceId?: string;
    autoRenew: boolean;
    productId?: string;
    price: number;
}) => {
    return (
        <For each={paymentProviders}>
            {(provider) => (
                <PaymentProvider
                    price={props.price}
                    productId={props.productId}
                    provider={provider}
                    autoRenew={props.autoRenew}
                    existingUserPaidServiceId={props.existingUserPaidServiceId}
                />
            )}
        </For>
    )
}

export const AutoRenewSwitch = (props: {
    autoRenew: boolean;
    setAutoRenew: (value: boolean) => void;
}) => {
    return (
        <Stack direction="row" justifyContent="space-between">
            <Stack>
                <Typography variant="body1">{lang.t.autoRenew()}</Typography>
                <Typography variant="body2" sx={{ fontSize: 12 }} color="textSecondary">
                    {lang.t.autoRenewDescription()}
                </Typography>
            </Stack>
            <MuiSwitch
                defaultChecked={props.autoRenew}
                value={props.autoRenew}
                onChange={(e) => props.setAutoRenew(e.target.checked)}
            />
        </Stack>
    );
};

export const MorePaymentProvidersByDisablingAutoRenew = (props: {
    autoRenew: boolean;
}) => {
    const paymentProvidersThatDoesNotSupportAutoRenew = createMemo(() => {
        return paymentProviders.filter((provider) => !provider.autoRenewSupported);
    });
    const canUnlockMoreProvidersByDisablingAutoRenew = createMemo(() => {
        return (
            props.autoRenew &&
            paymentProvidersThatDoesNotSupportAutoRenew().length > 0
        );
    });

    return (
        <Show when={canUnlockMoreProvidersByDisablingAutoRenew()}>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ fontSize: 12 }}>
                    {lang.t.unlockXPaymentsByDisablingAutoRenew({
                        paymentProviders: paymentProvidersThatDoesNotSupportAutoRenew()
                            .map((a) => a.displayName)
                            .join(", "),
                    })}
                </Typography>
            </Stack>
        </Show>
    );
};