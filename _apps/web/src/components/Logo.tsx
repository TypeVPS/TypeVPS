import { JSX } from "solid-js"
import serverImageUrl from "../icons/logo.png"

export const Logo = (props: {
	style: JSX.CSSProperties
}) => {
	return <img alt="TypeVPS logo" src={serverImageUrl} style={props.style} />
}
