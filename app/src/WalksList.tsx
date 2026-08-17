import type { Walk } from "@pedgehog/shared";
import {
	differenceInMinutes,
	format,
	formatDuration,
	intervalToDuration,
} from "date-fns";
import { type ReactNode, useEffect, useState } from "react";
import {
	CircleMarker,
	MapContainer,
	Polyline,
	TileLayer,
	Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
	deleteWalk,
	getAllStressorEvents,
	getStressorEvents,
	getWalkRoute,
	getWalks,
	type StressorEvent,
} from "./api";
import binImg from "./assets/bin.webp";
import idleImg from "./assets/pretzel-idle.webp";
import DsShell, { Loader } from "./DsShell";

function WalksList({ onBack }: { onBack: () => void }) {
	const [walks, setWalks] = useState<Walk[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [positions, setPositions] = useState<[number, number][] | null>(null);
	const [mapError, setMapError] = useState<string | null>(null);
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
	const [events, setEvents] = useState<StressorEvent[]>([]);
	const [allEvents, setAllEvents] = useState<StressorEvent[]>([]);

	useEffect(() => {
		getWalks()
			.then(setWalks)
			.catch(() => setError("Could not load walks"))
			.finally(() => setLoading(false));
		getAllStressorEvents().then(setAllEvents).catch(() => {});
	}, []);

	const handleDelete = async (id: number) => {
		try {
			await deleteWalk(id);
			setWalks((w) => w.filter((walk) => walk.id !== id));
			if (selectedId === id) {
				setSelectedId(null);
				setPositions(null);
			}
		} catch {
			setError("Could not delete walk");
		}
		setConfirmDeleteId(null);
	};

	const selectWalk = (id: number) => {
		const deselect = selectedId === id;
		setSelectedId(deselect ? null : id);
		setPositions(null);
		setMapError(null);
		setEvents([]);
		if (!deselect) {
			getWalkRoute(id)
				.then((geojson) => {
					setPositions(geojson.coordinates.map(([lng, lat]) => [lat, lng]));
				})
				.catch(() => setMapError("No route recorded"));
			getStressorEvents(id)
				.then(setEvents)
				.catch(() => {});
		}
	};

	const totalDistance = walks.reduce((sum, w) => sum + (w.distance ?? 0), 0);
	const totalMinutes = walks.reduce((sum, w) => {
		if (!w.ended_at) return sum;
		return (
			sum + differenceInMinutes(new Date(w.ended_at), new Date(w.started_at))
		);
	}, 0);
	const totalTime =
		totalMinutes < 1 && totalMinutes > 0
			? "< 1 min"
			: formatDuration(
					intervalToDuration({ start: 0, end: totalMinutes * 60 * 1000 }),
					{ format: ["hours", "minutes"] },
				) || "0 min";

	let topContent: ReactNode;
	if (selectedId && positions) {
		topContent = (
			<div className="ds-map-container">
				<MapContainer
					key={selectedId}
					bounds={positions}
					style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
				>
					<TileLayer
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						attribution="&copy; OSM"
					/>
					<Polyline positions={positions} color="#0F6E56" weight={3} />
					{events
						.filter((e) => e.lat && e.lng)
						.map((e) => (
							<CircleMarker
								key={e.id}
								center={[e.lat!, e.lng!]}
								radius={6}
								color={e.direction < 0 ? "#e05050" : "#48a848"}
								fillColor={e.direction < 0 ? "#e05050" : "#48a848"}
								fillOpacity={0.8}
								weight={2}
							>
								<Tooltip>
									<div>{e.label}{e.intensity ? ` (${e.intensity}/5)` : ""}</div>
									{e.notes && <div style={{ fontSize: 10, opacity: 0.7 }}>{e.notes}</div>}
								</Tooltip>
							</CircleMarker>
						))}
				</MapContainer>
			</div>
		);
	} else if (selectedId) {
		topContent = (
			<div className="ds-speech">{mapError ?? "Loading map..."}</div>
		);
	} else {
		topContent = <div className="ds-speech">Select a walk</div>;
	}

	return (
		<DsShell
			sprite={idleImg}
			top={topContent}
			listLayout
			bottom={
				<>
					<div className="ds-walks-header">
						<div className="ds-stats-inline">
							{loading ? (
								<Loader />
							) : (
								<>
									TOTAL{" "}
									{totalDistance >= 1000
										? `${(totalDistance / 1000).toFixed(1)}km`
										: `${Math.round(totalDistance)}m`}
									{" · "}
									{totalTime}
								</>
							)}
						</div>
						<button type="button" className="ds-btn-sm" onClick={onBack}>
							BACK
						</button>
					</div>

					{loading && (
						<div className="ds-speech">
							<Loader />
						</div>
					)}
					{error && <div className="ds-error">{error}</div>}

					<div className="ds-walks-list">
						{walks.map((w) => {
							const duration = w.ended_at
								? (
										formatDuration(
											intervalToDuration({
												start: new Date(w.started_at),
												end: new Date(w.ended_at),
											}),
											{ format: ["hours", "minutes"] },
										) || "< 1 min"
									)
										.replace(/ hours?/g, "hr")
										.replace(/ minutes?/g, "min")
								: "in progress";

							const walkEvents = allEvents.filter((e) => e.walk_id === w.id);
								const dogs = walkEvents.filter((e) => e.type === "dog_encounter").length;
								const cats = walkEvents.filter((e) => e.type === "cat_encounter").length;

								return (
								<button
									type="button"
									key={w.id}
									className={`ds-walk-row${selectedId === w.id ? " ds-walk-row-selected" : ""}`}
									onClick={() => selectWalk(w.id)}
								>
									<div className="ds-walk-left">
										<div className="ds-walk-date">
											{format(new Date(w.started_at), "EEE d MMM, h:mm a")}
											{dogs > 0 && " " + "🐕".repeat(dogs)}
											{cats > 0 && " " + "🐈".repeat(cats)}
										</div>
										<div className="ds-walk-suburb">
											{w.suburb ?? "Unknown"}
											{w.distance ? ` · ${Math.round(w.distance)}m` : ""}
											{" · "}
											{duration}
										</div>
									</div>
									<button
										type="button"
										className="ds-walk-delete"
										onClick={(e) => {
											e.stopPropagation();
											setConfirmDeleteId(w.id);
										}}
									>
										<img src={binImg} alt="Delete" />
									</button>
								</button>
							);
						})}
					</div>

					{confirmDeleteId && (
						<div className="ds-confirm-overlay">
							<div className="ds-confirm">
								<div className="ds-speech">Delete this walk?</div>
								<div className="ds-btn-row">
									<button
										type="button"
										className="ds-btn ds-btn-stop"
										onClick={() => handleDelete(confirmDeleteId)}
									>
										DELETE
									</button>
									<button
										type="button"
										className="ds-btn ds-btn-secondary"
										onClick={() => setConfirmDeleteId(null)}
									>
										CANCEL
									</button>
								</div>
							</div>
						</div>
					)}
				</>
			}
		/>
	);
}

export default WalksList;
