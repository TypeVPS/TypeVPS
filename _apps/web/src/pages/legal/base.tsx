/* eslint-disable solid/reactivity */
/* solid/components-return-once */

import { Typography } from "@suid/material"
import { JSX, For } from "solid-js"

export const ContentComponent = (props: {
    content: string | JSX.Element
}) => {
    if (typeof props.content === "string") {
        // eslint-disable-next-line 
        return <Typography variant="body1">
            <For each={props.content.split("\n").filter(line => !!line)}>{(line) => <>{line}<br />
            </>}</For>
        </Typography>
    } else {
        return props.content
    }
}