import { Paper } from "@suid/material"
import { EasyTable } from "@/components/EasyTable"
import { trpc } from "@/trpc"
import { CreateSubPageState } from "./base"

const DDOSSettingsPage = CreateSubPageState((props) => {
	const incidents = trpc.vms.ddosIncidents.useQuery(() => ({
		id: props.vm.id
	}))
	return (
		<>
			<Paper sx={{ p: 2 }}>


				<EasyTable
					title="DDOS Incidents"
					loading={incidents.isLoading}
					rows={[
						{
							key: "ip",
							label: "IP",
							align: "left"
						},
						{
							key: 'mbps',
							label: 'MBPS',
						},
						{
							key: 'date',
							label: 'Date',
							align: 'right'
						}
					]}
					data={incidents.data?.map((i) => ({
						ip: i.ip,
						mbps: i.mpbs,
						date: new Date(i.date).toLocaleString()
					})) ?? []}
				/>
			</Paper>
		</>
	)
})

export default DDOSSettingsPage
