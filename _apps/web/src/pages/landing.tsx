import { Link, useSearchParams } from "@solidjs/router";
import { Forward } from "@suid/icons-material";
import {
	Box,
	Button,
	Card,
	CardContent,
	FormControl,
	Grid,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	Typography
} from "@suid/material";
import {
	For,
	createEffect,
	createMemo,
	createSignal,
	onCleanup
} from "solid-js";
import lang from "@/lang";
import logoImageUrl from "../icons/logo.png";
import { trpc } from "@/trpc";
import { ApiProduct } from "@/types";
import { isPhone } from "../utils";

import { Footer } from "@/components/Footer";
import auth from "@/context/auth";
import ddosLogoUrl from "../icons/ddos.png";
import serverLogoUrl from "../icons/servers.png";
import supportLogoUrl from "../icons/support.png";
import { config } from "@/context/config";
import { useBuyContext } from "@/components/Shopping";
import { sizeBytesToHumanBigInt } from "@typevps/shared";

const useMediaQuery = (query: string) => {
	const [matches, setMatches] = createSignal(false);
	const mediaQueryList = window.matchMedia(query);
	setMatches(mediaQueryList.matches);

	const listener = (e: MediaQueryListEvent) => {
		setMatches(e.matches);
	};

	mediaQueryList.addEventListener("change", listener);
	onCleanup(() => {
		mediaQueryList.removeEventListener("change", listener);
	});

	return matches;
};

export const ProductDescription = (props: {
	product: ApiProduct;
}) => {
	const ram = createMemo(() => {
		return sizeBytesToHumanBigInt(props.product.ramBytes);
	});

	const cpu = createMemo(() => {
		return props.product.cpuCores;
	});

	const disk = createMemo(() => {
		return sizeBytesToHumanBigInt(props.product.diskBytes);
	});

	const description = createMemo(() => [
		{
			header: lang.t.location(),
			details: ["Frankfurt, Germany"],
		},
		{
			header: lang.t.specifications(),
			details: [
				lang.t.product.ram({ ramFormatted: ram() }),
				lang.t.product.cores({ cores: cpu() }),
				lang.t.product.SSDStorage({ storageFormatted: disk() }),
			],
		},
		{
			header: lang.t.network(),

			details: ["1Gbps uplink", "DDOS protection"],
		},
	]);

	return (
		<>
			<Stack direction="row" justifyContent="space-between">
				<div>
					<Typography variant="h4">{props.product.name}</Typography>
				</div>

				<Typography variant="h4">
					{lang.formatCurrency(props.product.monthlyPrice)} / month
				</Typography>
			</Stack>

			<Stack alignItems="center" mt={1} gap={1}>
				<For each={description()}>{(desc) => (
					<Stack alignItems="center">
						<Typography variant="h5" fontWeight={500}>
							{desc.header}
						</Typography>
						{desc.details?.map((detail) => (
							<Typography variant="body1" color="textSecondary">
								{detail}
							</Typography>
						)) ?? []}
					</Stack>
				)}</For>
			</Stack>
		</>
	);
};

const CenteredTitle = (props: {
	title: string;
	subTitle: string;
}) => {
	return (
		<Stack alignItems="center">
			<Typography variant="h1" fontWeight={500}>
				{props.title}
			</Typography>
			<Typography variant="body1">{props.subTitle}</Typography>
		</Stack>
	);
};

const Product = (props: { product: ApiProduct }) => {
	const label = createMemo(() => {
		if (props.product.stock <= 0) {
			return lang.t.product.soldOut();
		}

		return lang.t.product.buyButton({ pricePerMonth: props.product.monthlyPrice });
	});
	const buyContext = useBuyContext();

	return (
		<Card
			sx={{
				width: "100%",
			}}
		>
			<CardContent>
				<Stack gap={-1}>
					<ProductDescription product={props.product} />
				</Stack>

				<Button
					onClick={() => {
						buyContext.openBuyNewProductModal(props.product.id);
					}}
					sx={{ mt: 1, fontWeight: 600 }}
					fullWidth
					variant="contained"
					color="primary"
					disabled={props.product.stock <= 0}
				>
					{label()}
				</Button>
			</CardContent>
		</Card>
	);
};

const VPSProducts = () => {
	const products = trpc.products.list.useQuery(
		undefined,
		{
			refetchOnReconnect: false,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
		},
	);

	return (
		<Stack gap={3} alignItems="center">
			<CenteredTitle
				title={lang.t.landing.ourProducts()}
				subTitle={lang.t.landing.ourProductsDescription()}
			/>

			{products.isSuccess && !products.data.length && (
				<Typography variant="body2">{lang.t.product.noProducts()}</Typography>
			)}

			<Grid container gap={2}>
				<For each={products?.data}>
					{(product) => (
						<Grid item xs={12} md={3.85}>
							<Product product={product} />
						</Grid>
					)}
				</For>
			</Grid>
		</Stack>
	);
};

const WhatDoWeOffer = () => {
	const points = createMemo(() => [
		{
			header: lang.t.landing.fastAndReliable(),
			details: lang.t.landing.fastAndReliableDescription(),
			icon: serverLogoUrl,
		},
		{
			header: lang.t.landing.ddosProtection(),
			details: lang.t.landing.ddosProtectionDescription(),
			icon: ddosLogoUrl,
		},
		{
			header: lang.t.landing.support(),
			details: lang.t.landing.supportDescription(),
			icon: supportLogoUrl,
			bottomComponent: <Button endIcon={<Forward />}>Contact us</Button>,
		},
	]);

	return (
		<Box
			sx={{
				width: "100%",
				py: 10,
				my: 3,
				bgcolor: () => (isPhone() ? undefined : "rgba(35,35,35,0.9)"),
				px: 2,
			}}
		>
			<CenteredTitle
				title={lang.t.landing.whatDoWeOffer()}
				subTitle={lang.t.landing.whatDoWeOfferDescription()}
			/>

			<Grid container justifyContent="center" alignItems="center" gap={8}>
				<For each={points()}>
					{(point) => (
						<Grid item md={2.5} xs={12}>
							<Stack alignItems="center" mt={4} gap={2}>
								<img
									src={point.icon}
									alt="selling point icon"
									style={{
										width: "100px",
									}}
								/>
								<Typography variant="h3" fontWeight={500}>
									{point.header}
								</Typography>
								<Typography variant="body1">{point.details}</Typography>
							</Stack>
						</Grid>
					)}
				</For>
			</Grid>
		</Box>
	);
};

const ALookInside = () => {
	return (
		<Stack alignItems="center">
			<CenteredTitle
				title="A look inside"
				subTitle="We have a lot of servers and clients"
			/>
		</Stack>
	);
};

const FunStats = () => {
	const statsMessages = [
		{
			header: "Root servers",
			value: `> ${config.funStats.rootServers}`,
		},
		{
			header: "VPS servers",
			value: `> ${config.funStats.virtualServers}`,
		},
		{
			header: "Clients",
			value: `> ${config.funStats.clients}`,
		},
	];

	return (
		<Stack>
			<CenteredTitle
				title={lang.t.landing.funStats()}
				subTitle={lang.t.landing.funStatsDescription()}
			/>

			<Grid
				container
				justifyContent="center"
				alignItems="center"
				gap={2}
				px={isPhone() ? 2 : 40}
				mt={3}
			>
				<For each={statsMessages}>
					{(stat) => (
						<Grid item md={3} xs={12}>
							<Paper sx={{ p: 2 }}>
								<Stack alignItems="center">
									<Typography variant="h3" fontWeight={500}>
										{stat.value}
									</Typography>
									<Typography variant="body1">{stat.header}</Typography>
								</Stack>
							</Paper>
						</Grid>
					)}
				</For>
			</Grid>
		</Stack>
	);
};

const LanguageSelector = () => {
	const languages = [
		{
			name: "English",
			code: "en",
		},
		{
			name: "Dansk",
			code: "da",
		},
	];

	return (
		<FormControl size="small">
			<InputLabel>{lang.t.language()}</InputLabel>
			<Select
				value={lang.locale()}
				label={lang.t.language()}
				onChange={(e) => {
					lang.setLocale(e.target.value as 'en' | 'da');
				}}
			>
				<For each={languages}>
					{(lang) => <MenuItem value={lang.code}>{lang.name}</MenuItem>}
				</For>
			</Select>
		</FormControl>
	);
};

const Header = () => {
	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				maxWidth: "1200px",
				margin: "auto",
				padding: "20px 0",
				width: "100%",
			}}
		>
			<Box sx={{ width: "33%", textAlign: "left" }}>
				<Typography variant="h6">{lang.t.productName()}</Typography>
			</Box>


			<Box
				sx={{
					width: "33%",
					textAlign: "right",
					display: "flex",
					gap: 1,
					justifyContent: "flex-end",
				}}
			>
				<LanguageSelector />
				{!auth.isLoggedIn() && (
					<Button
						variant="contained"
						color="primary"
						LinkComponent={Link}
						href="/auth"
					>
						{lang.t.auth.login()}
					</Button>
				)}
			</Box>
		</Box>
	);
};

const LandingPage = () => {
	const isSmall = useMediaQuery("(max-width: 1000px)");

	return (
		// Center with max width of 1000px
		<Stack>
			<Header />

			<Stack alignItems="center" justifyContent="center">
				<Stack
					maxWidth={"1200px"}
					width="100%"
					flexDirection="column"
					gap={8}
					px={2}
				>
					<Stack
						direction={isSmall() ? "column" : "row"}
						alignItems={"center"}
						width={"100%"}
						flexDirection={isSmall() ? "column-reverse" : "row"}
					>
						{/* left title */}
						<Stack
							alignItems={isSmall() ? "center" : "flex-start"}
							maxWidth="2000px"
							width="100%"
							gap={0.5}
						>
							<Typography variant="h1" fontWeight={500}>
								{lang.t.landing.topHeader.superFast()}
							</Typography>
							<Typography variant="h1">
								{lang.t.landing.topHeader.andSecure()}
							</Typography>
							<Typography variant="h1">
								{lang.t.landing.topHeader.vpsHosting()}
							</Typography>

							<Typography variant="body1" maxWidth="90%" mt={1}>
								{lang.t.landing.topHeader.description()}
							</Typography>
						</Stack>

						{/* right button */}
						<Stack alignItems="center">
							<img
								alt="TypeVPS Logo"
								src={logoImageUrl}
								style={{
									"max-width": isSmall() ? "100px" : "100%",
									"margin-bottom": isSmall() ? "" : "",
								}}
							/>
						</Stack>
					</Stack>
					<VPSProducts />
				</Stack>
			</Stack>
			<Stack gap={8} mt={4}>
				<WhatDoWeOffer />
				{/* 				<FunStats />
				<ALookInside /> */}
				<Footer />
			</Stack>
		</Stack>
	);
};

export default LandingPage;
