import { type ChangeEvent, useMemo, useRef, useState } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Container,
	IconButton,
	TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DownloadIcon from "@mui/icons-material/Download";

type FunnelStep = {
	id: string;
	name: string;
	value: number;
};

type FunnelStepWithStats = FunnelStep & {
	stepConversion: number;
	totalConversion: number;
	dropOff: number;
};

const initialSteps: FunnelStep[] = [
	{ name: "Охоплення", value: 10000, id: "1" },
	{ name: "Побачили", value: 5000, id: "2" },
	{ name: "Клікнули", value: 2000, id: "3" },
	{ name: "Замовили", value: 100, id: "4" },
];

const FUNNEL_WIDTH = 480;
const SEGMENT_HEIGHT = 92;
const LEFT_SPACE = 180;
const RIGHT_SPACE = 230;
const LABEL_GAP = 44;
const LABEL_BOX_HEIGHT = 46;
const LABEL_HORIZONTAL_PADDING = 18;
const FUNNEL_COLOR = "#5b86d6";

function formatNumber(value: number): string {
	return new Intl.NumberFormat("uk-UA").format(value || 0);
}

function formatPercent(value: number): string {
	if (!Number.isFinite(value)) return "0%";
	return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

export default function SalesFunnelApp() {
	const [title, setTitle] = useState<string>("Воронка продажів");
	const [steps, setSteps] = useState<FunnelStep[]>(initialSteps);
	const exportRef = useRef<HTMLDivElement | null>(null);

	const data = useMemo<FunnelStepWithStats[]>(() => {
		const firstValue = steps[0]?.value || 0;

		return steps.map((step, index) => {
			const value = step.value || 0;
			const prevValue = steps[index - 1]?.value || 0;

			const stepConversion = index === 0 ? 100 : prevValue > 0 ? (value / prevValue) * 100 : 0;
			const totalConversion = firstValue > 0 ? (value / firstValue) * 100 : 0;
			const dropOff = index === 0 ? 0 : Math.max(prevValue - value, 0);

			return {
				...step,
				stepConversion,
				totalConversion,
				dropOff,
			};
		});
	}, [steps]);

	const lastItem = data.length > 0 ? data[data.length - 1] : null;
	const funnelHeight = data.length * SEGMENT_HEIGHT;
	const canvasWidth = LEFT_SPACE + FUNNEL_WIDTH + RIGHT_SPACE;
	const funnelLeft = LEFT_SPACE;

	const updateStep = (index: number, field: keyof FunnelStep, value: string): void => {
		setSteps((prev) =>
			prev.map((step, currentIndex) => {
				if (currentIndex !== index) return step;

				if (field === "value") {
					return {
						...step,
						value: Math.max(Number(value || 0), 0),
					};
				}

				return {
					...step,
					name: value,
				};
			})
		);
	};

	const addStep = (): void => {
		setSteps((prev) => [...prev, { name: "Новий етап", value: 0, id: Date.now().toString() }]);
	};

	const removeStep = (index: number): void => {
		setSteps((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
	};

	const handleTitleChange = (event: ChangeEvent<HTMLInputElement>): void => {
		setTitle(event.target.value);
	};

	const downloadAsPng = async (): Promise<void> => {
		const htmlToImage = await import("html-to-image");
		const node = exportRef.current;

		if (!node) return;

		const dataUrl = await htmlToImage.toPng(node, {
			cacheBust: true,
			pixelRatio: 2,
			backgroundColor: "#ffffff",
		});

		const link = document.createElement("a");
		link.download = "sales-funnel.png";
		link.href = dataUrl;
		link.click();
	};

	return (
		<Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc", paddingTop: 4, paddingBottom: 4 }}>
			<Container maxWidth="xl">
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: {
							xs: "1fr",
							lg: "420px 1fr",
						},
						gap: 3,
					}}
				>
					<Card sx={{ borderRadius: 4, boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" }}>
						<CardContent sx={{ padding: 3 }}>
							<Box sx={{ display: "grid", gap: 3 }}>
								<Box>
									<Box sx={{ fontSize: 24, fontWeight: 800, color: "#020617", lineHeight: 1.2 }}>
										Генератор воронки продажів
									</Box>
									<Box sx={{ marginTop: 0.5, fontSize: 14, color: "#64748b" }}>
										Додай етапи, введи цифри та скачай готову воронку як PNG.
									</Box>
								</Box>

								<TextField label="Назва графіка" value={title} onChange={handleTitleChange} fullWidth />

								<Box sx={{ display: "grid", gap: 1.5 }}>
									{steps.map((step, index) => (
										<Box
											key={step.id}
											sx={{
												display: "grid",
												gridTemplateColumns: "1fr 110px 40px",
												gap: 1,
												alignItems: "center",
											}}
										>
											<TextField
												value={step.name}
												onChange={(event: ChangeEvent<HTMLInputElement>) =>
													updateStep(index, "name", event.target.value)
												}
												placeholder="Назва етапу"
												size="small"
												fullWidth
											/>

											<TextField
												type="number"
												value={step.value}
												onChange={(event: ChangeEvent<HTMLInputElement>) =>
													updateStep(index, "value", event.target.value)
												}
												placeholder="К-сть"
												size="small"
												fullWidth
											/>

											<IconButton
												onClick={() => removeStep(index)}
												disabled={steps.length <= 2}
												size="small"
												aria-label="Видалити етап"
											>
												<DeleteOutlineIcon fontSize="small" />
											</IconButton>
										</Box>
									))}
								</Box>

								<Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
									<Button variant="outlined" startIcon={<AddIcon />} onClick={addStep}>
										Додати етап
									</Button>
									<Button variant="contained" startIcon={<DownloadIcon />} onClick={downloadAsPng}>
										Скачати PNG
									</Button>
								</Box>
							</Box>
						</CardContent>
					</Card>

					<Box
						ref={exportRef}
						sx={{
							backgroundColor: "#ffffff",
							borderRadius: 4,
							padding: {
								xs: 3,
								md: 4,
							},
							boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
							minHeight: 620,
						}}
					>
						<Box sx={{ textAlign: "center", marginBottom: 6 }}>
							<Box sx={{ fontSize: 34, fontWeight: 900, color: "#020617", lineHeight: 1.15 }}>
								{title}
							</Box>
							<Box sx={{ marginTop: 1, fontSize: 14, color: "#64748b" }}>
								Загальна конверсія: {formatPercent(lastItem?.totalConversion || 0)}
							</Box>
						</Box>

						<Box
							sx={{
								width: canvasWidth,
								maxWidth: "100%",
								height: funnelHeight,
								position: "relative",
								marginLeft: "auto",
								marginRight: "auto",
								overflow: "visible",
							}}
						>
							<Box
								sx={{
									position: "absolute",
									left: funnelLeft,
									top: 0,
									width: FUNNEL_WIDTH,
									height: funnelHeight,
								}}
							>
								{data.map((step, index) => {
									const count = data.length;
									const topWidth = 100 - (index / count) * 100;
									const bottomWidth = 100 - ((index + 1) / count) * 100;

									return (
										<Box
											key={`segment-${step.id}`}
											sx={{
												position: "absolute",
												top: index * SEGMENT_HEIGHT,
												left: 0,
												width: "100%",
												height: SEGMENT_HEIGHT,
												backgroundColor: FUNNEL_COLOR,
												borderTop: index === 0 ? "none" : "2px solid #ffffff",
												clipPath: `polygon(${(100 - topWidth) / 2}% 0, ${(100 + topWidth) / 2}% 0, ${(100 + bottomWidth) / 2}% 100%, ${(100 - bottomWidth) / 2}% 100%)`,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												color: "#ffffff",
												fontSize: {
													xs: index === 0 ? 36 : 28,
													md: index === 0 ? 62 : index === 1 ? 54 : 38,
												},
												fontWeight: 700,
												lineHeight: 1,
											}}
										>
											{formatNumber(step.value)}
										</Box>
									);
								})}
							</Box>

							{data.map((step, index) => {
								const count = data.length;
								const centerWidth = FUNNEL_WIDTH * (1 - ((index + 0.5) / count));
								const rightEdge = funnelLeft + FUNNEL_WIDTH / 2 + centerWidth / 2;
								const centerY = index * SEGMENT_HEIGHT + SEGMENT_HEIGHT / 2;

								return (
									<Box
										key={`label-${step.id}`}
										sx={{
											position: "absolute",
											top: centerY,
											left: rightEdge + LABEL_GAP,
											transform: "translateY(-50%)",
											minHeight: LABEL_BOX_HEIGHT,
											border: "2px solid #9ca3af",
											backgroundColor: "#ffffff",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											textAlign: "center",
											paddingLeft: `${LABEL_HORIZONTAL_PADDING}px`,
											paddingRight: `${LABEL_HORIZONTAL_PADDING}px`,
											fontSize: 16,
											fontWeight: 700,
											color: "#1f2937",
											boxShadow: "0 1px 2px rgba(15, 23, 42, 0.12)",
											whiteSpace: "nowrap",
										}}
									>
										{step.name}
									</Box>
								);
							})}

							{data.map((step, index) => {
								if (index === 0) return null;

								const count = data.length;
								const boundaryWidth = FUNNEL_WIDTH * (1 - (index / count));
								const leftEdge = funnelLeft + FUNNEL_WIDTH / 2 - boundaryWidth / 2;
								const centerY = index * SEGMENT_HEIGHT;

								return (
									<Box
										key={`percent-${step.id}`}
										sx={{
											position: "absolute",
											top: centerY,
											right: canvasWidth - leftEdge + LABEL_GAP,
											transform: "translateY(-50%)",
											minHeight: LABEL_BOX_HEIGHT,
											paddingLeft: "14px",
											paddingRight: "14px",
											border: "2px solid #9ca3af",
											backgroundColor: "#ffffff",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: 18,
											fontWeight: 700,
											color: "#1f2937",
											boxShadow: "0 1px 2px rgba(15, 23, 42, 0.12)",
											whiteSpace: "nowrap",
										}}
									>
										{formatPercent(step.stepConversion)}
									</Box>
								);
							})}
						</Box>
					</Box>
				</Box>
			</Container>
		</Box>
	);
}
