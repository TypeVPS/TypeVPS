import { z } from "zod"
import { router } from ".."
import { prismaClient } from "@/db"
import { adminAuthProcedure } from "../auth"
import { TRPCError } from "@trpc/server"
import { IpAddressKind } from "@typevps/db"
import { zod } from "@typevps/shared"

export const generateRandomMacAddress = () => {
	const chars = "0123456789abcdef"
	let mac = ""
	for (let i = 0; i < 6; i++) {
		mac += chars[Math.floor(Math.random() * chars.length)]
		mac += chars[Math.floor(Math.random() * chars.length)]
		if (i !== 5) {
			mac += ":"
		}
	}

	return mac
}
	

export const ipRouter = router({
	list: adminAuthProcedure.query(async () => {
		return await prismaClient.ipAddress.findMany({
			where: {},
			include: {
				AssignedIpAddress: true,
			},
		})
	}),
	remove: adminAuthProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			// is the ip assigned to a vm?
			const assigned = await prismaClient.assignedIpAddress.findFirst({
				where: {
					ipAddressId: input.id,
				},
			})

			if (assigned) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "IP is assigned to a VM",
				})
			}

			await prismaClient.ipAddress.delete({
				where: {
					id: input.id,
				},
			})
		}),
	add: adminAuthProcedure
		.input(zod.admin.addIp)
		.mutation(async ({ input }) => {
			await prismaClient.ipAddress.create({
				data: {
					address: input.address,
					kind: input.kind,
					subnet: input.subnet,
					gateway: input.gateway,
				},
			})
		}),

	stats: adminAuthProcedure.query(async () => {
		// count total ipv4 and ipv6
		// count how many are assigned

		const ips = await prismaClient.ipAddress.findMany({
			where: {},
			include: {
				AssignedIpAddress: true,
			},
		})

		return {
			total: ips.length,
			ipv4: ips.filter((ip) => ip.kind === IpAddressKind.IPV4).length,
			ipv6: ips.filter((ip) => ip.kind === IpAddressKind.IPV6).length,
			ipv4Assigned: ips.filter(
				(ip) => ip.kind === IpAddressKind.IPV4 && ip.AssignedIpAddress,
			).length,
			ipv6Assigned: ips.filter(
				(ip) => ip.kind === IpAddressKind.IPV6 && ip.AssignedIpAddress,
			).length,
		}
	}),
})
