import { z } from "zod";
import { router } from "..";
import { adminAuthProcedure, authProcedure } from "../auth";
import { zod } from "@typevps/shared";
import { prismaClient } from "../../db";
import { ensureTemplateImageExists } from "@/installUtils/image";
import { createLiveLogger } from "@/liveLogger";
import { ENV } from "@/env";

export const templateRouter = router({
    create: adminAuthProcedure.input(zod.admin.createTemplate).mutation(({ input }) => {
        const liveLogger = createLiveLogger({
            type: 'createTemplate',
            logic: async (logger) => {
                await ensureTemplateImageExists({
                    qcow2Url: input.qcow2Url,
                    osType: input.osType,
                }, ENV.PROXMOX_NODE, logger)

                logger.log("Creating template...")

                await prismaClient.installTemplate.create({
                    data: {
                        ...input,
                    }
                })

                logger.success("Template created")
            }
        })

        return {
            liveLogId: liveLogger.liveLogId,
        }
    }),
    delete: adminAuthProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ input, ctx }) => {
        return prismaClient.installTemplate.delete({
            where: {
                id: input.id,
            }
        })
    }),
    list: authProcedure.query(async ({ ctx }) => {
        const templates = await prismaClient.installTemplate.findMany({
            select: {
                id: true,
                name: true,
                osType: true,
                createdAt: true,
                minimumCpuCores: true,
                minimumDiskBytes: true,
                minimumRamBytes: true,
            }
        })

        return templates
    })
})