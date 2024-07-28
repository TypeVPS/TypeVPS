import { JSX, Show, createSignal } from "solid-js";
import {
	ApiVirtualMachine,
	ApiVirtualMachineS
} from "@/types";

export const [vm, setVm] = createSignal<ApiVirtualMachine | undefined>(
	undefined,
);

export const CreateSubPage = (
	Component: (props: { vm: ApiVirtualMachine }) => JSX.Element,
) => {
	return () => {
		return (
			<Show when={vm()}>
				<Component vm={vm() as ApiVirtualMachine} />
			</Show>
		);
	};
};

export const CreateSubPageState = (
	Component: (props: { vm: ApiVirtualMachineS }) => JSX.Element,
) => {
	return () => {
		return (
			<>
				<Show when={vm()?.state}>
					<Component vm={vm() as ApiVirtualMachineS} />
				</Show>
			</>
		);
	};
};
