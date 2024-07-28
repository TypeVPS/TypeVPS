import { TextField } from "@suid/material"
import { createSignal } from "solid-js"
import { VirtualMachineTable } from "@/components/tables/VirtualMachines"
import { trpc } from "@/trpc"
import { createDebounce } from "../utils"
import { VirtualMachineTablePretty } from "@/components/tables/VirtualMachinesPretty"

const ServerListPage = () => {
	const [query, setQuery] = createSignal("")
	const queryDebounced = createDebounce(query, 200)

	const vms = trpc.vms.list.useQuery(() => ({
		query: queryDebounced(),
	}), {
		//refetchInterval: 1000,
	})

	return (
		<>
			<main>
				{/* Center X */}
				<div
					style={{
						width: "100%",
						display: "flex",
						"flex-direction": "row",
						"justify-content": "center",
					}}
				>
					<div
						style={{
							"max-width": "1200px",
							width: "100%",
							display: "flex",
							"flex-direction": "column",
							gap: "12px",
							"margin-top": "12px",
						}}
					>
						<TextField
							variant="filled"
							label="Search for VM, user email"
							fullWidth
							onChange={(e) => {
								setQuery(e.target.value)
							}}
						/>

						<VirtualMachineTablePretty
							vms={vms.data ?? []}
							isLoading={vms.isLoading}
						/>
					</div>
				</div>
			</main>
		</>
	)
}

export default ServerListPage