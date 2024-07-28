import { z } from "zod";
import { middleware, procedure, router } from ".";
import argon2 from "argon2";
import { prismaClient } from "@/db";
import { User, UserRole } from "@typevps/db";
import crypto from "node:crypto";
import { createSigner, createVerifier } from "fast-jwt";
import { Context } from "@/context";
import { TRPCError } from "@trpc/server";

import dayjs from "dayjs";
import { sendPasswordResetEmail } from "../mail/resetPassword";
import { ENV } from "../env";
import { sendRecentLoginEmail } from "../mail/recentLogin";

const SECURE_COOKIE = process.env.NODE_ENV === "production";
export const COOKIES = {
	IS_LOGGED_IN: "PS_IS_LOGGED_IN",
	REFRESH_TOKEN: "PS_REFRESH_TOKEN",
	ACCESS_TOKEN: "PS_ACCESS_TOKEN",
};

export const validateJwt = async (jwt: string | undefined) => {
	if (!jwt) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authorized, missing access token",
		});
	}

	try {
		const data = (await jwtVerifier(jwt)) as PubJwtData;
		return data;
	} catch (err) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authorized, invalid access token",
		});
	}
};

export const authMiddleware = middleware(async ({ ctx, next }) => {
	const jwtData = await validateJwt(ctx.req.cookies[COOKIES.ACCESS_TOKEN]);

	return next({
		ctx: {
			user: jwtData,
			ensureRole: (role: UserRole) => {
				if (!jwtData.roles.includes(role)) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: `Not authorized, missing role: ${role}`,
					});
				}
			},
			isAdmin: () => {
				return jwtData.roles.includes("ADMIN");
			},
		},
	});
});

const generateRoleAuthMiddleware = (role: UserRole) => {
	return authMiddleware.unstable_pipe(async ({ ctx, next }) => {
		if (!ctx.user.roles.includes(role)) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: `Not authorized, missing role: ${role}`,
			});
		}

		return await next();
	});
};
const adminAuthMiddleware = generateRoleAuthMiddleware("ADMIN");
export const authProcedure = procedure.use(authMiddleware);
export const adminAuthProcedure = procedure.use(adminAuthMiddleware);

export interface PubJwtData {
	id: number;
	roles: UserRole[];
	fullName: string;
	email: string;
}

const ACCESS_TOKEN_EXPIRY = 1000 * 60 * 24;

const signer = createSigner({
	// eslint-disable-next-line @typescript-eslint/require-await
	key: async () => ENV.JWT_SECRET,
	algorithm: "HS256",
	// expire in 24m
	expiresIn: ACCESS_TOKEN_EXPIRY,
});

export const jwtVerifier = createVerifier({
	// eslint-disable-next-line @typescript-eslint/require-await
	key: async () => ENV.JWT_SECRET,
	algorithms: ["HS256"],
});

const generateRefreshToken = async (user: User, ctx: Context) => {
	// generate a random string using node crypto
	const refreshToken = await new Promise<string>((resolve, reject) => {
		crypto.randomBytes(64, (err, buf) => {
			if (err) {
				reject(err);
			} else {
				resolve(buf.toString("hex"));
			}
		});
	});

	// store the refresh token in the database
	await prismaClient.refreshToken.create({
		data: {
			token: refreshToken,
			userId: user.id,
			createdIp: ctx.req.ip,
		},
	});

	return refreshToken;
};

const generateAccessToken = async (user: User) => {
	// generate access token
	const jwtData: PubJwtData = {
		id: user.id,
		roles: user.roles,
		fullName: user.fullName,
		email: user.email,
	};

	const accessToken = await signer(jwtData);
	return accessToken;
};

const generateAndSetRefreshToken = async (user: User, ctx: Context) => {
	const refreshToken = await generateRefreshToken(user, ctx);
	void ctx.res.cookie(COOKIES.REFRESH_TOKEN, refreshToken, {
		httpOnly: true,
		path: "/",
		secure: SECURE_COOKIE,
	});

	// set a non httpOnly cookie, so the client can access it
	void ctx.res.cookie(COOKIES.IS_LOGGED_IN, "loggedIn", {
		httpOnly: false,
		path: "/",
		secure: SECURE_COOKIE,
	});
};

const generateAndSetAccessToken = async (user: User, ctx: Context) => {
	const accessToken = await generateAccessToken(user);
	void ctx.res.cookie(COOKIES.ACCESS_TOKEN, accessToken, {
		path: "/",
		httpOnly: false,
		secure: SECURE_COOKIE,
		expires: new Date(Date.now() + ACCESS_TOKEN_EXPIRY),
	});
};

export const authRouter = router({
	register: procedure
		.input(
			z.object({
				email: z.string().email().toLowerCase(),
				password: z.string().min(6),
				fullName: z.string().min(2),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// does the user already exist?
			const userExists = await prismaClient.user.findUnique({
				where: {
					email: input.email,
				},
				select: {
					id: true,
				},
			});
			if (userExists) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "User with email already exists",
				});
			}

			const hashedPassword = await argon2.hash(input.password);
			const user = await prismaClient.user.create({
				data: {
					email: input.email,
					password: hashedPassword,
					fullName: input.fullName,
					roles: ["USER"],
				},
			});

			if (user.id === 1) {
				await prismaClient.user.update({
					where: {
						id: user.id,
					},
					data: {
						roles: {
							push: "ADMIN",
						},
					},
				});
			}

			await generateAndSetRefreshToken(user, ctx);
			await generateAndSetAccessToken(user, ctx);
		}),
	login: procedure
		.input(
			z.object({
				email: z.string().email().toLowerCase(),
				password: z.string().min(6),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// get user from database
			const user = await prismaClient.user.findUnique({
				where: {
					email: input.email,
				},
			});

			if (!user) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "User with email does not exist",
				});
			}

			// verify password
			const passwordValid = await argon2.verify(user.password, input.password);
			if (!passwordValid) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Incorrect password",
				});
			}

			await generateAndSetRefreshToken(user, ctx);
			await generateAndSetAccessToken(user, ctx);

			void sendRecentLoginEmail(user.email, {
				contactUrl: "https://typevps.com/contact",
				locale: 'en-US',
				loginDate: new Date(),
				loginDevice: ctx.req.headers['user-agent'] as string,
				loginIp: ctx.getIpAddress(),
				loginLocation: 'Unknown',
				userFirstName: user.fullName.split(' ')[0],
			})
		}),
	logout: procedure.mutation(async ({ ctx }) => {
		// remove refresh token from database
		const cookie = ctx.req.cookies[COOKIES.REFRESH_TOKEN];
		if (cookie) {
			await prismaClient.refreshToken.deleteMany({
				where: {
					token: cookie,
				},
			});
		}

		// remove cookies
		void ctx.res.clearCookie(COOKIES.REFRESH_TOKEN);
		void ctx.res.clearCookie(COOKIES.ACCESS_TOKEN);
		void ctx.res.clearCookie(COOKIES.IS_LOGGED_IN);
	}),
	refresh: procedure.mutation(async ({ ctx }) => {
		// does the refresh token exist?
		// is the refresh token valid?
		// generate new access token
		// set new access token

		const cookie = ctx.req.cookies[COOKIES.REFRESH_TOKEN];
		if (!cookie) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "No refresh token",
			});
		}

		const refreshToken = await prismaClient.refreshToken.findUnique({
			where: {
				token: cookie,
			},
			include: {
				User: true,
			},
		});

		if (!refreshToken) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Invalid refresh token",
			});
		}

		await generateAndSetAccessToken(refreshToken.User, ctx);
	}),

	requestPasswordReset: procedure
		.input(
			z.object({
				email: z.string().email(),
			}),
		)
		.mutation(async ({ input }) => {
			// does the user exist?
			const user = await prismaClient.user.findUnique({
				where: {
					email: input.email,
				},
			});

			if (!user) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "User with email does not exist",
				});
			}

			// generate token
			const resetToken = await prismaClient.passwordResetToken.create({
				data: {
					userId: user.id,
					expiresAt: dayjs().add(1, "day").toDate(),
				},
			});

			// send email with token
			await sendPasswordResetEmail({
				email: user.email,
				token: resetToken.token,
			});
		}),

	resetPassword: procedure
		.input(
			z.object({
				token: z.string().toLowerCase(),
				password: z.string().min(6),
			}),
		)
		.mutation(async ({ input }) => {
			const resetToken = await prismaClient.passwordResetToken.findUnique({
				where: {
					token: input.token,
				},
				include: {
					User: true,
				},
			});

			if (!resetToken) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Invalid token",
				});
			}

			if (dayjs().isAfter(dayjs(resetToken.expiresAt))) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Token expired",
				});
			}

			if (resetToken.usedAt !== null) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Token already used",
				});
			}

			// hash password
			const hashedPassword = await argon2.hash(input.password);

			// update user password and token
			await prismaClient.$transaction([
				prismaClient.user.update({
					where: {
						id: resetToken.userId,
					},
					data: {
						password: hashedPassword,
					},
				}),
				prismaClient.passwordResetToken.update({
					where: {
						token: input.token,
					},
					data: {
						usedAt: new Date(),
					},
				}),
			]);

			// invalidate all refresh tokens
			await prismaClient.refreshToken.updateMany({
				where: {
					userId: resetToken.userId,
					expiredAt: null,
				},
				data: {
					expiredAt: new Date(),
				},
			});
		}),

	// note, this does not have any auth, this could possibly be a security issue.
	// i dont think exposing names from emails is a big deal, but it could be.
	getUserByEmail: procedure
		.input(
			z.object({
				email: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const user = await prismaClient.user.findFirst({
				where: {
					email: input.email,
				},
				select: {
					email: true,
					id: true,
				},
			});

			return user;
		}),

	requestAccountDeletion: authProcedure.mutation(async ({ ctx }) => {
		const user = await prismaClient.user.findUnique({
			where: {
				id: ctx.user.id,
			},
		});

		if (!user) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "User does not exist",
			});
		}

		return "ok";
		/* // generate token
		const deleteToken = await prismaClient.accountDeletionToken.create({
			data: {
				userId: user.id,
				expiresAt: dayjs().add(1, 'day').toDate(),	
			}
		})

		// send email with token
		await sendAccountDeletionEmail({
			email: user.email,
			token: deleteToken.token
		}) */
	}),
});
