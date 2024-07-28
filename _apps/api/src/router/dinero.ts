import { z } from "zod";
import { router } from "."
import { ENV } from "../env"
import { adminAuthProcedure } from "./auth"
import * as dineroAuth from '../accounting/dinero/auth'

export const dineroRouter = router({
    redirect: adminAuthProcedure.query(async ({ ctx }) => {
        await ctx.res.redirect(dineroAuth.generateRedirectUrl())

    }),
    callback: adminAuthProcedure.query(async ({ ctx }) => {
        const data = await dineroAuth.exchangeCodeForToken(dineroAuth.exchangeCodeForTokenSchema.parse(ctx.req.query))
        const accessToken = await dineroAuth.getAccessToken()

        return {
            data
        }
    })
})