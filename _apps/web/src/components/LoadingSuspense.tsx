import { useIsRouting } from "@solidjs/router"
import { Typography, CircularProgress } from "@suid/material"
import { JSX, Suspense, createEffect, createMemo, createSignal, onMount } from "solid-js"

export const LoadingSuspense = (props: { children: JSX.Element }) => {
    const isRouting = useIsRouting()

    const [isLoading, setIsLoading] = createSignal(true)
    createEffect(() => {
        if (isRouting()) {
            setIsLoading(true)
        } else {
            setTimeout(() => {
                setIsLoading(false)
            }, 150)
        }
    })

    return (
        <Suspense fallback={<div></div>
        }>
            <div style={{
                opacity: isLoading() ? 1 : 1,
                filter: isLoading() ? "blur(4px)" : "none",
                // only transition when its not loading
                transition: isLoading() ? "none" : "opacity 0.25s ease-in-out, filter 0.25s ease-in-out"
            }}>
                {props.children}
            </div>
        </Suspense>
    )
}