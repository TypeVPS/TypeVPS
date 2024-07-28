/* eslint-disable solid/components-return-once */
import { useNavigate } from "@solidjs/router";
import { Add, Refresh } from "@suid/icons-material";
import {
	Alert,
	Card,
	CardContent,
	CardHeader,
	CircularProgress,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography
} from "@suid/material";
import { createEffect, createMemo, For, JSX, Show } from "solid-js";
import lang from "@/lang";
import { isPhone } from "../utils";

interface Row {
	key: string;
	label: string;
	sortable?: boolean;
	align?: "left" | "right" | "center";
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	defaultValue?: string | ((row: any) => JSX.Element);
	disabled?: boolean;
}
interface RowData {
	// key based on the row key
	[key: string]: string | JSX.Element;
}

export const CardEasyTable = (props: {
	rows: Row[];
	data: RowData[];
	title?: string;
	subTitle?: string;
	refresh?: {
		refetch: () => void;
		isLoading: boolean;
	};
	loading?: boolean;
	bottom?: JSX.Element;
	create?: () => void;
	href?: (row: RowData) => string;
	disabledMessage?: string;
	phoneRowComponent?: (row: RowData) => JSX.Element;
}) => {
	return (
		<Card>
			<CardHeader
				title={props.title}
				subheader={
					<Typography variant="body2">{props.subTitle ?? ""}</Typography>
				}
			/>

			<CardContent sx={{ gap: 2, display: "flex", flexDirection: "column" }}>
				<Show
					when={!props.disabledMessage}
					fallback={
						<Alert severity="warning">{props.disabledMessage}</Alert>
						/* 						<Typography variant="body2" color="text.secondary">
							{props.disabledMessage}
						</Typography> */
					}
				>
					<EasyTable
						rows={props.rows}
						data={props.data}
						loading={props.loading}
					/>
				</Show>

				{!props.disabledMessage && props.bottom}
			</CardContent>
		</Card>
	);
};

export const EasyTable = (props: {
	rows: Row[];
	data: RowData[] | undefined
	title?: string | JSX.Element;
	refresh?: {
		refetch: () => void;
		isLoading: boolean;
	};
	loading?: boolean;
	right?: JSX.Element;
	create?: () => void;
	href?: (row: RowData) => string;
	cardMode?: boolean;
	phoneRowComponent?: (row: RowData) => JSX.Element;
}) => {
	const rows = createMemo(() => {
		return props.rows.filter((row) => !row.disabled);
	});

	const navigator = useNavigate();
	createEffect(() => {
		props.data?.forEach((row) => {
			rows().forEach((col) => {
				if (!row[col.key] && !col.defaultValue && row?.key) {
					throw new Error(`Row ${row.key as string} is missing column ${col.key}`);
				}
			});
		});
	});

	const HeaderTitle = () => {
		if (typeof props.title === "string") {
			return <Typography variant="h6">{props.title}</Typography>;
		}

		return props.title;
	};

	const HeaderRight = () => {
		return (
			<Stack direction="row" alignItems="center">
				{props.create && (
					<IconButton onClick={props.create}>
						<Add />
					</IconButton>
				)}

				{props.refresh && (
					<IconButton
						onClick={props.refresh.refetch}
						disabled={props.refresh.isLoading}
					>
						<Refresh />
					</IconButton>
				)}
				{props.right}
			</Stack>
		);
	};

	const Cell = (row: RowData, col: Row) => {
		if (row[col.key]) {
			return row[col.key];
		}

		if (col.defaultValue) {
			if (typeof col.defaultValue === "string") {
				return col.defaultValue;
			}

			return col.defaultValue(row);
		}

		return <></>;
	};

	const showMobileFriendlyComponent = createMemo(
		() => isPhone() && props.phoneRowComponent,
	);

	return (
		<>
			<Stack>
				{props.title && (
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
					>
						<HeaderTitle />
						<HeaderRight />
					</Stack>
				)}

				<Table>
					{!showMobileFriendlyComponent() && (
						<TableHead>
							<TableRow>
								<For each={rows()}>
									{(row) => (
										<TableCell align={row.align ?? undefined}>
											{row.label}
										</TableCell>
									)}
								</For>
							</TableRow>
						</TableHead>
					)}
					<TableBody>
						<For each={props.data}>
							{(col) => (
								<TableRow
									onClick={() => {
										if (props.href) {
											navigator(props.href(col));
										}
									}}
								>
									<Show
										when={showMobileFriendlyComponent()}
										fallback={
											<For each={rows()}>
												{(row) => (
													<TableCell align={row.align ?? undefined}>
														{Cell(col, row)}
													</TableCell>
												)}
											</For>
										}
									>
										{props.phoneRowComponent && (
											<>{props.phoneRowComponent(col)}</>
										)}
									</Show>
								</TableRow>
							)}
						</For>
					</TableBody>
					<Show when={props.loading}>
						<CircularProgress />
					</Show>
					<Show when={props.data?.length === 0 && !props.loading}>
						<Typography variant="body1">{lang.t.noResults()}</Typography>
					</Show>
				</Table>
			</Stack>
		</>
	);
};
