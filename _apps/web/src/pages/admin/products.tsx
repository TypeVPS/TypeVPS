import { createForm } from "@felte/solid";
import { validator } from "@felte/validator-zod";
import {
	Button,
	ButtonGroup,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
} from "@suid/material";

import {
	Check,
	Clear,
	CopyAll,
	Delete,
	Edit,
	FileCopy
} from "@suid/icons-material";
import { createEffect, createMemo, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { z } from "zod";
import { ConfirmButton } from "@/components/ConfirmButton";
import { EasyTable } from "@/components/EasyTable";
import { ErrorLabel } from "@/components/ErrorLabel";
import { LoadingButton } from "@/components/LoadingButton";
import { FormSelect } from "@/components/form/FormSelect";
import { FormTextField } from "@/components/form/FormTextField";
import lang from "@/lang";
import { trpc } from "@/trpc";
import type { ApiProduct } from "@/types";
import { ApiProductType } from "@/types";
import { CreateProductInput } from "@typevps/shared/src/zod/admin";
import { FormCheckbox } from "@/components/form/FormCheckbox";
import Notifications from "@/components/Notifications";
import { sizeBytesToHumanBigInt } from "@typevps/shared";

type PubProductOptionalId = Omit<ApiProduct, "id"> & { id?: string };
const [createEditProductDialog, setCreateEditProductDialog] = createStore({
	open: false,
	product: null as PubProductOptionalId | null,
});
const openCreateNewProductDialog = () => {
	setCreateEditProductDialog({
		open: true,
		product: null,
	});
};
const openEditProductDialog = (product: PubProductOptionalId) => {
	setCreateEditProductDialog({
		open: true,
		product: product,
	});
};

export const getProductBuyUrl = (productId: string) => {
	const url = new URL(window.location.origin);
	url.searchParams.set("buyProductId", productId);
	return url.toString();
}


const CreateEditProductContext = () => {
	const handleClose = () => {
		setCreateEditProductDialog({
			open: false,
			product: null,
		});
	};

	const schema = z.object({
		type: z.enum(ApiProductType),
		name: z.string(),
		ramGb: z.number(),
		cpuCores: z.number(),
		diskGb: z.number(),
		dedicatedMbit: z.number(),
		burstMbit: z.number(),
		bandwidthGb: z.number(),
		monthlyPrice: z.number(),
		isUserSpecialOffer: z.boolean(),
	});
	type Schema = z.infer<typeof schema>;

	const trpcContext = trpc.useContext();

	const createProductMutation = trpc.products.create.useMutation({
		onSuccess: (data) => {
			void trpcContext.products.list.invalidate();
			void trpcContext.products.listAdmin.invalidate();

			void navigator.clipboard.writeText(
				getProductBuyUrl(data.id)
			);

			//console.log(data.id)



			Notifications.notify({
				message: "Product created, link copied to clipboard",
				type: "success",
				time: 5000
			})

			handleClose();
		},
	});
	const editProductMutation = trpc.products.edit.useMutation({
		onSuccess: () => {
			void trpcContext.products.list.invalidate();
			void trpcContext.products.listAdmin.invalidate();
			handleClose();
		},
	});

	const form = createForm<Schema>({
		extend: [validator({ schema, level: "error" })],
		onSubmit: (values) => {
			const options: CreateProductInput = {
				cpuCores: values.cpuCores,
				diskBytes: values.diskGb * 1024 * 1024 * 1024,
				name: values.name,
				monthlyPrice: values.monthlyPrice,
				ramBytes: values.ramGb * 1024 * 1024 * 1024,
				type: "VPS",
				networkBandwidthBurstMegabit: values.burstMbit,
				networkBandwidthBytes: values.bandwidthGb * 1024 * 1024 * 1024,
				networkBandwidthDedicatedMegabit: values.dedicatedMbit,
				isUserSpecialOffer: values.isUserSpecialOffer,
			};

			if (isEditingExistingProduct()) {
				if (!createEditProductDialog.product?.id) {
					throw new Error("Product ID is missing");
				}

				void editProductMutation.mutateAsync({
					...options,
					id: createEditProductDialog.product?.id,
				});
			} else {
				void createProductMutation.mutateAsync({
					...options,
				});
			}
		},
	});

	createEffect(() => {
		if (createEditProductDialog.product) {
			form.setFields({
				type: createEditProductDialog.product.type,
				name: createEditProductDialog.product.name,
				description: createEditProductDialog.product.description,
				monthlyPrice: createEditProductDialog.product.monthlyPrice,
				ramGb:
					Number(createEditProductDialog.product.ramBytes) / 1024 / 1024 / 1024,
				cpuCores: createEditProductDialog.product.cpuCores,
				diskGb:
					Number(createEditProductDialog.product.diskBytes) /
					1024 /
					1024 /
					1024,
				dedicatedMbit:
					createEditProductDialog.product.networkBandwidthDedicatedMegabit,
				burstMbit: createEditProductDialog.product.networkBandwidthBurstMegabit,
				bandwidthGb:
					Number(createEditProductDialog.product.networkBandwidthBytes) /
					1024 /
					1024 /
					1024,
				isUserSpecialOffer: createEditProductDialog.product.isUserSpecialOffer,
			});
		}
	});

	const isEditingExistingProduct = createMemo(() => {
		return createEditProductDialog.product?.id !== undefined;
	});

	return (
		<>
			<Dialog open={createEditProductDialog.open} onClose={handleClose}>
				<form ref={form.form}>
					<DialogTitle>
						{isEditingExistingProduct() ? "Edit Product" : "Create New Product"}
					</DialogTitle>
					<DialogContent
						sx={{
							width: "600px",
							maxWidth: "100%",
						}}
					>
						<Stack gap={3} mt={1}>
							<FormTextField name="name" label="Product Name" form={form} />

							<FormSelect
								form={form}
								label="Product Type"
								name="type"
								options={[
									{
										value: "VPS",
										label: "VPS",
									},
								]}
							/>

							{/* Currency */}
							<FormTextField
								name="monthlyPrice"
								type="number"
								label="Price per month"
								form={form}
							/>

							{/* Ram , CPU & DISK */}
							<Stack direction="row" gap={2}>
								<FormTextField
									type="number"
									name="ramGb"
									label="Ram GB"
									form={form}
								/>
								<FormTextField
									type="number"
									name="cpuCores"
									label="CPU"
									form={form}
								/>
								<FormTextField
									type="number"
									name="diskGb"
									label="Disk GB"
									form={form}
								/>
							</Stack>

							{/* Ram , CPU & DISK */}
							<Stack direction="row" gap={2}>
								<FormTextField
									type="number"
									name="dedicatedMbit"
									label="Dedicated Mbit/s"
									form={form}
								/>
								<FormTextField
									type="number"
									name="burstMbit"
									label="Burst Mbit/s"
									form={form}
								/>
								<FormTextField
									type="number"
									name="bandwidthGb"
									label="Bandwidth GB"
									form={form}
								/>
							</Stack>
						</Stack>

						<FormCheckbox
							label="User Special offer"
							name="isUserSpecialOffer"
						/>

						{/* list of errors */}
						<ErrorLabel errors={form.errors()} />
					</DialogContent>

					<DialogActions>
						<Button onClick={handleClose}>Cancel</Button>
						<LoadingButton
							type="submit"
							loading={
								createProductMutation.isLoading || editProductMutation.isLoading
							}
						>
							{isEditingExistingProduct() ? "Edit Product" : "Create Product"}
						</LoadingButton>
						<ErrorLabel
							errors={
								createProductMutation.error?.message ||
								editProductMutation.error?.message
							}
						/>
					</DialogActions>
				</form>
			</Dialog>
		</>
	);
};

const Actions = (props: { product: ApiProduct }) => {
	const trpcContext = trpc.useContext();
	const deleteProductMutation = trpc.products.delete.useMutation({
		onSuccess: () => {
			void trpcContext.products.list.invalidate();
			void trpcContext.products.listAdmin.invalidate();
		},
	});

	return (
		<ButtonGroup>
			<Button
				startIcon={<Edit />}
				onClick={() => {
					openEditProductDialog(props.product);
				}}
			>
				{lang.t.edit()}
			</Button>
			<ConfirmButton startIcon={<Delete />} onClick={() => {
				void deleteProductMutation.mutate({
					id: props.product.id
				})
			}}>
				{lang.t.delete()}
			</ConfirmButton>
			<Button
				startIcon={<FileCopy />}
				onClick={() => {
					openEditProductDialog({
						...props.product,
						id: undefined,
					});
				}}
			>
				{lang.t.clone()}
			</Button>
			<Button
				startIcon={<CopyAll />}
				onClick={() => {
					navigator.clipboard.writeText(
						getProductBuyUrl(props.product.id)
					).then(() => {
						Notifications.notify({
							message: "Link copied to clipboard",
							type: "success",
							time: 5000
						})
					}).catch(() => {
						Notifications.notify({
							message: "Failed to copy link to clipboard",
							type: "error",
							time: 5000
						})
					})
				}}
			>
				{lang.t.copyUrl()}
			</Button>
		</ButtonGroup>
	)
}

const AdminProductsPage = () => {
	const products = trpc.products.listAdmin.useQuery();
	const trpcContext = trpc.useContext();

	const SortFeaturedButtons = (props: { product: ApiProduct }) => {
		const featuredMutation = trpc.products.setFeatured.useMutation();
		const setSortIndexMutation = trpc.products.setSortOrder.useMutation();
		// eslint-disable-next-line solid/reactivity
		const [sortOrder, setSortOrder] = createSignal(props.product.sortOrder);
		const isChanged = createMemo(() => props.product.sortOrder !== sortOrder());

		const invalidate = () => {
			void trpcContext.products.list.invalidate();
			void trpcContext.products.listAdmin.invalidate();
		};

		return (
			<Stack direction="row">
				<LoadingButton
					size="small"
					loading={featuredMutation.isLoading}
					onClick={() => {
						void featuredMutation.mutateAsync({
							id: props.product.id,
							featured: !props.product.featured,
						}).then(invalidate)
					}}
				>
					{props.product.featured ? <Check /> : <Clear />}
				</LoadingButton>
				{/* 				<TextField
					size="small"
					type="number"
					label="Sort Index"
					value={sortOrder()}
					onChange={(e) => {
						setSortOrder(Number(e.target.value));
					}}
					disabled={setSortIndexMutation.isLoading}
				/> */}

				{isChanged() && (
					<LoadingButton
						loading={setSortIndexMutation.isLoading}
						size="small"
						variant="outlined"
						disabled={setSortIndexMutation.isLoading}
						onClick={() => {
							void setSortIndexMutation.mutateAsync({
								id: props.product.id,
								sortOrder: sortOrder(),
							}).then(invalidate)
						}}
					>
						Save
					</LoadingButton>
				)}
			</Stack>
		);
	};

	return (
		<div>
			<CreateEditProductContext />

			<EasyTable
				title={lang.t.products()}
				right={
					<Button variant="contained" onClick={openCreateNewProductDialog}>
						{lang.t.createProduct()}
					</Button>
				}
				loading={products.isLoading}
				rows={[
					{
						key: "name",
						label: lang.t.name(),
					},
					{
						key: "type",
						label: lang.t.type(),
					},
					{
						key: "cpuCores",
						label: lang.t.cpuCores(),
					},
					{
						key: "ramGb",
						label: lang.t.ram(),
					},
					{
						key: "diskGb",
						label: lang.t.storage(),
					},
					{
						key: "bandwidthGb",
						label: lang.t.bandwidth(),
					},
					{
						key: "isUserSpecialOffer",
						label: 'User Special Offer'
					},
					{
						key: "monthlyPrice",
						label: lang.t.price(),
					},
					{
						key: "sortIndexFeatured",
						label: "lang.t.featured()",
					},
					{
						key: "actions",
						label: lang.t.actions(),
						align: "right",
					},
				]}
				data={
					products.data?.map((product) => ({
						name: product.name,
						type: product.type,
						cpuCores: product.cpuCores,
						ramGb: sizeBytesToHumanBigInt(product.ramBytes),
						diskGb: sizeBytesToHumanBigInt(product.diskBytes),
						bandwidthGb: sizeBytesToHumanBigInt(product.networkBandwidthBytes),
						monthlyPrice: lang.formatCurrency(product.monthlyPrice),
						sortIndexFeatured: <SortFeaturedButtons product={product} />,
						isUserSpecialOffer: product.isUserSpecialOffer ? 'Yes' : 'No',
						actions: (
							<Actions product={product} />
						),
					})) ?? []
				}
			/>
		</div>
	);
};

export default AdminProductsPage;
