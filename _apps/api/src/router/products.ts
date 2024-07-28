import { Product } from "@typevps/db";
import { z } from "zod";
import { procedure, router } from ".";
import { prismaClient } from "@/db";
import { adminAuthProcedure } from "./auth";
import { sizeBytesToHuman, sizeBytesToHumanBigInt, zod } from "@typevps/shared";
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration'
import { inferAsyncReturnType } from "@trpc/server";
import { CreateProductInput } from "@typevps/shared/src/zod/admin";
dayjs.extend(duration)

type ApiProduct = Product & {
	stock: number;
}

const getStockBaseInfo = async () => {
	const ipsAvailable = await prismaClient.ipAddress.count({
		where: {
			//AssignedIpAddress: input.all ? undefined : null,
			AssignedIpAddress: null,
			kind: "IPV4",
		},
	});

	return {
		ipsAvailable,
		nodeInfo: [{
			node: "node1",
			ramBytesAvailable: 0,
			cpuAvailable: 0,
			storageBytesAvailable: 0,
		}]
	}
}
type StockBaseInfo = inferAsyncReturnType<typeof getStockBaseInfo>;

const calculateStock = (stockInfo: StockBaseInfo, product: Product) => {
	return stockInfo.ipsAvailable;
}

const getApiProduct = async (product: Product, stockInfo?: StockBaseInfo) => {
	if (!stockInfo) {
		stockInfo = await getStockBaseInfo();
	}

	return {
		...product,
		stock: calculateStock(stockInfo, product),
	} as ApiProduct;
}

const getApiProducts = async (products: Product[], stockInfo?: StockBaseInfo) => {
	if (!stockInfo) {
		stockInfo = await getStockBaseInfo();
	}

	return Promise.all(products.map(async (product) => {
		return await getApiProduct(product, stockInfo);
	}))
}

const generateProductDescription = (product: CreateProductInput) => {
	return `CPU: ${product.cpuCores} vCPU - RAM: ${sizeBytesToHuman(product.ramBytes)} - Storage: ${sizeBytesToHuman(product.diskBytes)}`
}

export const productRouter = router({
	get: procedure
		.input(z.object({
			id: z.string(),
		}))
		.query(async ({ input }) => {
			const product = await prismaClient.product.findUnique({
				where: {
					id: input.id,
				},
			});

			if (!product) {
				throw new Error("Product not found");
			}

			return await getApiProduct(product);
		}),

	list: procedure
		.query(async () => {
			const products = await prismaClient.product.findMany({
				where: {
					disabledAt: null,
					isUserSpecialOffer: false,
					featured: true,
				},
				orderBy: {
					monthlyPrice: "asc",
				}
			});

			return await getApiProducts(products);
		}),
	listAdmin: adminAuthProcedure
		.query(async () => {
			const products = await prismaClient.product.findMany({
				orderBy: {
					createdAt: "asc"
				}
			});

			return await getApiProducts(products);
		}),

	create: adminAuthProcedure
		.input(zod.admin.createProduct)
		.mutation(async ({ input }) => {
			const product = await prismaClient.product.create({
				data: {
					...input,
					description: generateProductDescription(input),
				},
				select: {
					id: true,
				}
			});

			return product;
		}),
	edit: adminAuthProcedure
		.input(zod.admin.editProduct)
		.mutation(async ({ input }) => {
			return await prismaClient.product.update({
				where: {
					id: input.id,
				},
				data: {
					...input,
					description: generateProductDescription(input),
				},
			});
		}),

	disableEnable: adminAuthProcedure
		.input(zod.admin.disableEnableProduct)
		.mutation(async ({ input }) => {
			return await prismaClient.product.update({
				where: {
					id: input.id,
				},
				data: {
					disabledAt: input.enabled ? null : new Date(),
				},
			});
		}),

	setFeatured: adminAuthProcedure
		.input(zod.admin.setFeaturedProduct)
		.mutation(async ({ input }) => {
			await prismaClient.product.update({
				where: {
					id: input.id,
				},
				data: {
					featured: input.featured,
				},
			});
		}),

	setSortOrder: adminAuthProcedure
		.input(zod.admin.setSortOrderProduct)
		.mutation(async ({ input }) => {
			await prismaClient.product.update({
				where: {
					id: input.id,
				},
				data: {
					sortOrder: input.sortOrder,
				},
			});
		}),

	funStats: procedure
		.meta({
			cache: dayjs.duration({
				hours: 1
			})
		})
		.query(async () => {
			const stats = await prismaClient.$transaction([
				prismaClient.user.count(),
				prismaClient.userVirtualMachine.count({
					where: {
						UserPaidService: {
							expiresAt: {
								gt: new Date(),
							}
						}
					}
				}),
			])

			return {
				clients: stats[0],
				virtualServers: stats[1],

			}
		}),
	delete: adminAuthProcedure
		.input(z.object({
			id: z.string(),
		}))
		.mutation(async ({ input }) => {
			await prismaClient.product.delete({
				where: {
					id: input.id,
				},
			});
		}
		),

});
