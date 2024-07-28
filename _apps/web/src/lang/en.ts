import { formatCurrency, formatDateTime } from "./utils";

export const en = {
	productName: "TypeVPS",
	productFooterDescription: "Hosting for the modern age",

	routeNames: {
		shop: "Shop",
		servers: "Servers",
		admin: "Admin",
		settings: "Settings",

		serverRoutes: {
			install: "Install",
			overview: "Overview",
			settings: "Settings",
			installLogs: "Install Logs",
			backups: "Backups",
			ddosIncidents: "DDoS Incidents",
		},

		adminRoutes: {
			products: "Products",
			payments: "Payments",
			subscriptions: "Subscriptions",
			users: "Users",
			ips: "IPs",
			vms: "VMS",
		},
	},

	subscriptionStatus: {
		active: (params: { date: Date | null }) =>
			`Active, expires on ${formatDateTime(params.date)}`,
		pending: "Pending",
		expired: (params: { date: Date | null }) => `Expired at ${formatDateTime(params.date)}`,
		cancelled: (params: { date: Date | null }) => `Cancelled at ${formatDateTime(params.date)}`,
		pendingExpired: "Pending expired",
	},

	location: "Location",
	network: "Network",
	specifications: "Specifications",
	product: {
		cores: (params: { cores: number }) => `${params.cores} vCPU Cores`,
		ram: (params: { ramFormatted: string }) => `${params.ramFormatted} of RAM`,
		SSDStorage: (params: { storageFormatted: string }) =>
			`${params.storageFormatted} of SSD Storage`,
		bandwidth: (params: { bandwidthFormatted: string }) =>
			`${params.bandwidthFormatted} of Bandwidth`,
		buyButton: (params: { pricePerMonth: number }) =>
			`Buy for ${formatCurrency(params.pricePerMonth)} / month`,
		soldOut: "Sold out",
		noProducts: "No products available",
	},

	and: 'and',

	auth: {
		emailStepTitle: "Login / Register",
		registerStepTitle: "Register",
		loginStepTitle: "Login",
		sendingEmail: 'Sending email...',
		sentCheckYourEmail: 'Sent! check your email',
		email: "Email address",
		password: "Password",
		confirmPassword: "Confirm password",
		continueExistingUser: "Welcome back!",
		continueNewUser: "Welcome!",
		login: "Login",
		register: "Register",
		forgotPassword: "Forgot password?",
		invalidEmail: "Invalid email address",
		createAccount: "Create account",
		createNewAccount: 'Create new account',

		iAccept: 'I accept',
		termsOfService: 'terms of service',
		privacyPolicy: "privacy policy"
	},

	landing: {
		// top header
		topHeader: {
			superFast: "Super fast",
			andSecure: "and secure",
			vpsHosting: "VPS-Hosting",
			description:
				"We offer high performance VPS hosting with a focus on security and privacy. Register with a temporary email, pay with Bitcoin and get your VPS up and running in minutes.",
		},

		//
		funStats: "Fun stats",
		funStatsDescription: "We are proud of our numbers. Here are some of them.",

		ourProducts: "Our products",
		ourProductsDescription: "We offer a wide range of products and services",

		whatDoWeOffer: "What do we offer?",
		whatDoWeOfferDescription:
			"We offer a wide range of products and services, all of which are designed to meet the needs of our customers.",

		// 1
		fastAndReliable: "Fast and reliable",
		fastAndReliableDescription:
			"Our servers are equipped with high-performance Ryzen processors and ultra-fast NVMe storage. This guarantees exceptional performance and reliability, ensuring your server consistently meets the demands of your requirements, while instilling confidence in the quality of our offerings.",

		// 2
		ddosProtection: "DDoS protection",
		ddosProtectionDescription:
			"Up-time is a key factor in the success of your business. We provide DDOS protection to ensure that your server is always available, even during the most intense attacks.",

		// 3
		support: "Support",
		supportDescription:
			"We provide 24/7 support to ensure that your server is always available, even during the most intense attacks.",
	},

	// generic
	name: "Name",
	email: "Email",
	age: "Age",
	ram: "RAM",
	cpu: "CPU",
	cpuCores: "CPU Cores",
	storage: "Storage",
	bandwidth: "Bandwidth",
	price: "Price",
	title: "Title",
	description: "Description",
	status: "Status",
	actions: "Actions",
	refresh: "Refresh",
	start: "Start",
	stop: "Stop",
	guestTools: "Guest Tools",
	fullName: "Full name",
	subscriptions: "Subscriptions",
	payments: "Payments",
	changePassword: "Change password",
	noResults: "No results",
	cancel: "Cancel",
	user: "User",
	createdAt: "Created at",
	lastLogin: "Last login",
	users: "Users",
	role: "Role",
	type: "Type",
	activeServices: "Active services",
	amount: "Amount",
	details: "Details",
	add: "Add",
	edit: "Edit",
	delete: "Delete",
	clone: "Clone",
	disk: "Disk",
	copyUrl: "Copy URL",

	hour: "Hour",
	day: "Day",
	week: "Week",
	buyX: (params: { x: string }) => `Buy ${params.x}`,

	//
	products: "Products",
	createProduct: "Create product",

	addIp: "Add IP",
	ips: "IPs",

	configureVM: "Configure VM",
	configureVMDescription: "Configure your VM to your liking",
	vmIsReadyToConfigure: "Your VM is ready to be configured",

	deleteVM: "Delete VM",
	deleteVMDescription: "Deleting a VM is irreversible. Are you sure you want to delete this VM? After deletion, all data will be lost. After deletion, you will be able to reinstall the VM with a new OS.",
	//
	autoRenew: "Auto Renew",
	autoRenewDescription: "Automatically renew your subscription every month",

	// server
	cancelSubscriptionDialogMessage:
		"Are you sure you want to cancel this subscription?",
	cancelSubscriptionDialogTitle: "Cancel subscription",

	paymentMethod: "Payment method",
	choosePaymentMethod: "Choose payment method",
	paymentStatus: "Payment status",
	expiresOrRenewsAt: "Expires / Renews at",
	buyLoginToContinue: 'Please login to buy "{{product}}"',

	// not organized
	memoryUsage: "Memory usage",
	diskUsage: "Disk usage",
	networkUsage: "Network usage",
	cpuUsage: "CPU usage",
	view: "View",
	goToProduct: "Go to product",
	guestToolsAreNotRunning: "Guest tools are not running",
	changeAccountDetails: "Change account details",
	addSSHKey: "Add SSH key",
	sshKey: "SSH key",

	loginToContinue: "Login to continue",
	shoppingCart: "Shopping cart",
	totalCost: "Total cost",
	language: "Language",

	running: "Running",
	stopped: "Stopped",
	unknown: "Unknown",

	connectionDetails: "Connection details",
	resetPasswordForX: (params: { x: string }) => `Reset password for '${params.x}'`,
	resetPassword: "Reset password",
	ipAddress: "IP address",
	rootPassword: "Root password",
	connectionType: "Connection type",
	username: "Username",
	extend: "Extend",
	reinstall: "Reinstall",
	installVPS: "Install VPS",

	enableDisableAutoRenew: (params: { on: boolean }) =>
		params.on ? "Disable Auto Renew" : "Enable Auto Renew",

	autoRenewOnOff: (params: { on: boolean }) =>
		`Auto renew: ${params.on ? "on" : "off"}`,

	unlockXPaymentsByDisablingAutoRenew: (params: {
		paymentProviders: string;
	}) => `Unlock ${params.paymentProviders} by disabling auto renew`,

	xOfxUsed: (params: { used: string; total: string }) =>
		`${params.used} of ${params.total} used`,
	xFree: (params: { free: string }) => `${params.free} free`,
};
