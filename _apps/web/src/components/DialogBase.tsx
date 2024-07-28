import { Dialog, DialogContent, DialogTitle, Stack, Typography } from "@suid/material"
import { JSX } from "solid-js"

export const DialogBase = (props: {
    title: string
    titleDetails?: string
    children: JSX.Element
    open: boolean
    onClose: () => void
    ref?: HTMLFormElement | ((el: HTMLFormElement) => void) | undefined
}) => {
    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
        >
            <DialogTitle>
                <Stack direction="column">
                    <div>{props.title}</div>
                    <Typography variant="body2">{props.titleDetails}</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{
                width: 500,
                maxWidth: '100%',
            }}>
                <form style={{ display: 'flex', 'flex-direction': 'column', 'gap': '16px', 'margin-top': '6px' }}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    ref={props.ref}
                >
                    {props.children}
                </form>
            </DialogContent>
        </Dialog>
    )
}