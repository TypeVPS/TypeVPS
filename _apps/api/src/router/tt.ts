import { router } from ".";
import { ipRouter } from "./admin/ips";
import { templateRouter } from "./admin/templates";
import { authRouter } from "./auth";
import { configRouter } from "./config";
import { dineroRouter } from "./dinero";
import { paymentRouter } from "./payments/payments";
import { userPaidServiceRouter } from "./payments/service";
import { subscriptionRouter } from "./payments/subscriptions";
import { productRouter } from "./products";
import { userRouter } from "./users";
import { vmRouter } from "./vms";
import { vmAdminRouter } from "./vms/admin";
import { vmAgentRouter } from "./vms/agent";
import { vmInstallRouter } from "./vms/install";
import { sshRouter } from "./vms/ssh";

export const appRouter = router({
	vms: vmRouter,
	vmAdmin: vmAdminRouter,
	payments: paymentRouter,
	subscriptions: subscriptionRouter,
	userPaidServices: userPaidServiceRouter,
	agent: vmAgentRouter,

	products: productRouter,
	auth: authRouter,
	users: userRouter,
	ssh: sshRouter,
	vmInstall: vmInstallRouter,

	config: configRouter,

	ips: ipRouter,
	dinero: dineroRouter,
	templates: templateRouter,
});
export type AppRouter = typeof appRouter;
