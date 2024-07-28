import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { router } from ".."
import { prismaClient } from "@/db"
import { authProcedure } from "../auth"
import axios from "axios"

export const sshRouter = router({
	list: authProcedure.query(async ({ ctx }) => {
		return prismaClient.sshKey.findMany({
			where: {
				userId: ctx.user.id,
			},
			select: {
				name: true,
				id: true,
			},
		})
	}),
	create: authProcedure
		.input(
			z.object({
				name: z.string(),
				key: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// does the key already exist?
			const existing = await prismaClient.sshKey.findFirst({
				where: {
					key: input.key,
					userId: ctx.user.id,
				},
			})
			if (existing) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "SSH key already exists",
				})
			}

			return prismaClient.sshKey.create({
				data: {
					name: input.name,
					key: input.key,
					userId: ctx.user.id,
				},
			})
		}),

	import: authProcedure
		.input(
			z.object({
				provider: z.enum(["github"]),
				userName: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (input.provider === "github") {
				// get ssh keys from github
				const keys = await axios.get(
					`https://api.github.com/users/${input.userName}/keys`,
				)
				const keysZod = z.array(
					z.object({
						id: z.number(),
						key: z.string(),
					}),
				)
				const parsedKeys = keysZod.parse(keys.data)

				// create ssh keys
				await prismaClient.sshKey.createMany({
					data: parsedKeys.map((key) => ({
						key: key.key,
						name: `github-${key.id}`,
						userId: ctx.user.id,
					})),
				})
			}
		}),
})
