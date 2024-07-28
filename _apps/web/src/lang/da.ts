import { formatCurrency, formatDateTime } from "./utils";

export const da = {
	productName: "TypeVPS",
	productFooterDescription: "Hosting for den moderne tidsalder",

	routeNames: {
		shop: "Butik",
		servers: "Servere",
		admin: "Admin",
		settings: "Indstillinger",

		serverRoutes: {
			install: "Installer",
			overview: "Oversigt",
			settings: "Indstillinger",
			installLogs: "Installationslogs",
			backups: "Backups",
			ddosIncidents: "DDoS-hændelser",
		},

		adminRoutes: {
			products: "Produkter",
			payments: "Betalinger",
			subscriptions: "Abonnementer",
			users: "Brugere",
			ips: "IPs",
			vms: "VMS",
		},
	},

	subscriptionStatus: {
		active: (params: { date: Date | null }) =>
			`Aktiv, udløber den ${formatDateTime(params.date)}`,
		pending: "Afventer",
		expired: (params: { date: Date | null }) => `Udløbet den ${formatDateTime(params.date)}`,
		cancelled: (params: { date: Date | null }) => `Aflyst den ${formatDateTime(params.date)}`,
		pendingExpired: "Afventer udløb",
	},

	location: "Lokation",
	network: "Netværk",
	specifications: "Specifikationer",
	product: {
		cores: (params: { cores: number }) => `${params.cores} vCPU Kerner`,
		ram: (params: { ramFormatted: string }) => `${params.ramFormatted} RAM`,
		SSDStorage: (params: { storageFormatted: string }) =>
			`${params.storageFormatted} SSD-lagerplads`,
		bandwidth: (params: { bandwidthFormatted: string }) =>
			`${params.bandwidthFormatted} Båndbredde`,
		buyButton: (params: { pricePerMonth: number }) =>
			`Køb for ${formatCurrency(params.pricePerMonth)} / måned`,
		soldOut: "Udsolgt",
		noProducts: "Ingen produkter tilgængelige",
	},

	and: 'og',

	auth: {
		emailStepTitle: "Log ind / Registrer",
		registerStepTitle: "Registrer",
		loginStepTitle: "Log ind",
		sendingEmail: 'Sender email...',
		sentCheckYourEmail: 'Sendt! tjek din email',

		email: "Emailadresse",
		password: "Adgangskode",
		confirmPassword: "Bekræft adgangskode",
		continueExistingUser: "Velkommen tilbage!",
		continueNewUser: "Velkommen!",
		login: "Log ind",
		register: "Registrer",
		forgotPassword: "Glemt adgangskode?",
		invalidEmail: "Ugyldig emailadresse",
		createAccount: "Opret konto",
		createNewAccount: 'Opret ny konto',

		iAccept: 'Jeg accepterer',
		termsOfService: 'betingelser for brug',
		privacyPolicy: "privatlivspolitikken"
	},

	landing: {
		topHeader: {
			superFast: "Super hurtig",
			andSecure: "og sikker",
			vpsHosting: "VPS-hosting",
			description:
				"Vi tilbyder højtydende VPS-hosting med fokus på sikkerhed og privatliv. Registrer med en midlertidig e-mail, betal med Bitcoin, og få din VPS op at køre på få minutter.",
		},

		funStats: "Sjove statistikker",
		funStatsDescription:
			"Vi er stolte af vores statistikker. Her er nogle af dem.",

		ourProducts: "Vores produkter",
		ourProductsDescription:
			"Vi tilbyder et bredt udvalg af produkter og tjenester",

		whatDoWeOffer: "Hvad tilbyder vi?",
		whatDoWeOfferDescription:
			"Vi tilbyder et bredt udvalg af produkter og tjenester, der alle er designet til at opfylde vores kunders behov.",

		// 1
		fastAndReliable: "Hurtig og pålidelig",
		fastAndReliableDescription:
			"Vores servere er udstyret med højtydende Ryzen-processorer og ultra-hurtig NVMe-lagring. Dette garanterer enestående ydeevne og pålidelighed, hvilket sikrer, at din server konsekvent imødekommer kravene til dine behov, samtidig med at du får tillid til kvaliteten af vores tilbud.",

		// 2
		ddosProtection: "DDoS-beskyttelse",
		ddosProtectionDescription:
			"Oppetid er en nøglefaktor i din virksomheds succes. Vi tilbyder DDoS-beskyttelse for at sikre, at din server altid er tilgængelig, selv under de mest intense angreb.",

		// 3
		support: "Support",
		supportDescription:
			"Vi tilbyder 24/7 support for at sikre, at din server altid er tilgængelig, selv under de mest intense angreb.",
	},

	// generic
	name: "Navn",
	email: "Email",
	age: "Alder",
	ram: "RAM",
	cpu: "CPU",
	cpuCores: "CPU Kerner",
	storage: "Lagerplads",
	bandwidth: "Båndbredde",
	price: "Pris",
	title: "Titel",
	description: "Beskrivelse",
	status: "Status",
	actions: "Handlinger",
	refresh: "Opdater",
	start: "Start",
	stop: "Stop",
	guestTools: "Gæsteværktøjer",
	fullName: "Fulde navn",
	subscriptions: "Abonnementer",
	payments: "Betalinger",
	changePassword: "Skift adgangskode",
	noResults: "Ingen resultater",
	cancel: "Annuller",
	user: "Bruger",
	createdAt: "Oprettet den",
	lastLogin: "Sidste login",
	users: "Brugere",
	role: "Rolle",
	type: "Type",
	activeServices: "Aktive tjenester",
	amount: "Beløb",
	details: "Detaljer",
	add: "Tilføj",
	edit: "Rediger",
	delete: "Slet",
	clone: "Klon",
	disk: "Disk",
	copyUrl: "Kopier URL",

	hour: "Time",
	day: "Dag",
	week: "Uge",
	buyX: (params: { x: string }) => `Køb ${params.x}`,

	//
	products: "Produkter",
	createProduct: "Opret produkt",

	addIp: "Tilføj IP",
	ips: "IPs",

	configureVM: "Konfigurer VM",
	configureVMDescription: "Konfigurer din VM med de ønskede specifikationer",

	deleteVM: "Slet VM",
	deleteVMDescription: "Er du sikker på, at du vil slette denne VM? Denne handling kan ikke fortrydes.",
	vmIsReadyToConfigure: "VM er klar til at blive konfigureret",

	//
	autoRenew: "Auto forny",
	autoRenewDescription: "Forny automatisk dit abonnement hver måned",

	// server
	cancelSubscriptionDialogMessage:
		"Er du sikker på, at du vil annullere dette abonnement?",
	cancelSubscriptionDialogTitle: "Annuller abonnement",

	paymentMethod: "Betalingsmetode",
	choosePaymentMethod: "Vælg betalingsmetode",
	paymentStatus: "Betalingsstatus",
	expiresOrRenewsAt: "Udløber / Fornyes den",
	buyLoginToContinue: 'Log ind for at købe "{{product}}"',

	// not organized
	memoryUsage: "Hukommelsesforbrug",
	diskUsage: "Diskforbrug",
	networkUsage: "Netværksforbrug",
	cpuUsage: "CPU-forbrug",
	view: "Se",
	goToProduct: "Gå til produkt",
	guestToolsAreNotRunning: "Gæsteværktøjer kører ikke",
	changeAccountDetails: "Skift kontodetaljer",
	addSSHKey: "Tilføj SSH-nøgle",
	sshKey: "SSH-nøgle",

	loginToContinue: "Log ind for at fortsætte",
	shoppingCart: "Indkøbskurv",
	totalCost: "Totalpris",
	language: "Sprog",

	running: "Kører",
	stopped: "Stoppet",
	unknown: "Ukendt...",

	connectionDetails: "Forbindelsesdetaljer",
	resetPasswordForX: (params: { x: string }) => `Nulstil kodeord for: '${params.x}'`,
	resetPassword: "Nulstil kodeord",
	ipAddress: "IP-adresse",
	rootPassword: "Root-adgangskode",
	username: "Brugernavn",
	extend: "Forlæng",
	reinstall: "Geninstaller",
	installVPS: "Installer VPS",

	enableDisableAutoRenew: (params: { on: boolean }) =>
		params.on ? "Deaktiver autorenew" : "Aktiver autorenew",

	autoRenewOnOff: (params: { on: boolean }) =>
		params.on ? "Auto forny: TIL" : "Auto forny: FRA",

	unlockXPaymentsByDisablingAutoRenew: (params: {
		paymentProviders: string;
	}) =>
		`Lås ${params.paymentProviders} op ved at deaktivere automatisk fornyelse`,

	xOfxUsed: (params: { used: string; total: string }) =>
		`${params.used} af ${params.total} brugt`,
	xFree: (params: { free: string }) => `${params.free} ledig`,
};
