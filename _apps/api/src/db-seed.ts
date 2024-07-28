import { PrismaClient } from "@typevps/db";
import argon2 from "argon2";

const mbToBytes = (mb: number) => mb * 1024 * 1024;
const gbToBytes = (gb: number) => gb * 1024 * 1024 * 1024;

const prisma = new PrismaClient();

const createProducts = async () => {
	await prisma.product.upsert({
		where: { id: "asd" },
		update: {},
		create: {
			cpuCores: 1,
			ramBytes: mbToBytes(512),
			diskBytes: gbToBytes(10),
			monthlyPrice: 10,
			description: "A small server",
			id: "asd",
			name: "Small",
			networkBandwidthBurstMegabit: 100,
			networkBandwidthDedicatedMegabit: 100,
			networkBandwidthBytes: gbToBytes(500),
			type: "VPS",
		},
	});
	await prisma.product.upsert({
		where: { id: "asd2" },
		update: {},
		create: {
			cpuCores: 2,
			ramBytes: mbToBytes(1024),
			diskBytes: gbToBytes(20),
			monthlyPrice: 20,
			description: "A medium server",
			id: "asd2",
			name: "Medium",
			networkBandwidthBurstMegabit: 100,
			networkBandwidthDedicatedMegabit: 100,
			networkBandwidthBytes: gbToBytes(500),
			type: "VPS",
		},
	});
	await prisma.product.upsert({
		where: { id: "asd3" },
		update: {},
		create: {
			cpuCores: 4,
			ramBytes: mbToBytes(2048),
			diskBytes: gbToBytes(40),
			monthlyPrice: 40,
			description: "A large server",
			id: "asd3",
			name: "Large",
			networkBandwidthBurstMegabit: 100,
			networkBandwidthDedicatedMegabit: 100,
			networkBandwidthBytes: gbToBytes(500),
			type: "VPS",
		},
	});
};

export const createUsers = async () => {
	console.log("Creating demo admin user... \ndemo@demo.com\ndemo");
	await prisma.user.upsert({
		where: { id: 1 },
		update: {},
		create: {
			id: 1,
			email: "demo@demo.com",
			password: await argon2.hash("demo"),
			fullName: "Demo User",
			roles: ["ADMIN", "USER"],
		},
	});
};

async function main() {
	await prisma.$connect();
	await createProducts();
}
main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
