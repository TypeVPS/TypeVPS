import { Navigation } from "@suid/icons-material"
import { Dialog, DialogTitle, DialogContent, Link, DialogActions, Button, Box, Fab } from "@suid/material"
import { createSignal, createEffect } from "solid-js"
import { config } from "@/context/config"

export const LiveChat = () => {
    const [isLoaded, setIsLoaded] = createSignal(false)
    const [isAcceptPopupOpen, setIsAcceptPopupOpen] = createSignal(false)

    const loadChat = () => {
        localStorage.setItem("hasAcceptedCookiePolicy", "true")
        setIsLoaded(true)

        const script = document.createElement("script")
        script.src = config.liveChatScriptSrc
        script.async = true
        script.defer = true
        document.body.appendChild(script)
    }

    createEffect(() => {
        if (!config.liveChatScriptSrc) {
            return
        }

        const hasAcceptedCookiePolicy = localStorage.getItem("hasAcceptedCookiePolicy")
        if (hasAcceptedCookiePolicy) {
            loadChat()
        }
    })


    return (
        <>
            <Dialog open={isAcceptPopupOpen()} onClose={() => setIsAcceptPopupOpen(false)}>
                <DialogTitle>
                    You need to accept our Cookie & Privacy policy to use the live chat.
                </DialogTitle>

                <DialogContent>
                    By clicking "Accept", you agree to our <Link href="/privacy">Privacy Policy and Cookie Policy</Link>.
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => {
                        setIsAcceptPopupOpen(false)
                    }}>
                        Cancel
                    </Button>
                    <Button onClick={() => {
                        loadChat()
                        setIsAcceptPopupOpen(false)
                    }}>
                        Accept
                    </Button>
                </DialogActions>
            </Dialog>

            <Box sx={{
                // make it always on top, and stick to the bottom right
                position: "fixed",
                bottom: 32,
                right: 32,
            }}>
                {!isLoaded() && <Fab variant="extended" size="large" onClick={() => setIsAcceptPopupOpen(true)}>
                    <Navigation sx={{ mr: 1 }} />
                    LIVE CHAT
                </Fab>}
            </Box>
        </>
    )
}