import type { Walk } from "@pedgehog/shared";
import {
	differenceInMinutes,
	format,
	formatDuration,
	intervalToDuration,
} from "date-fns";
import { type ReactNode, useEffect, useState } from "react";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { deleteWalk, getWalkRoute, getWalks } from "./api";
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

	useEffect(() => {
		getWalks()
			.then(setWalks)
			.catch(() => setError("Could not load walks"))
			.finally(() => setLoading(false));
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
		if (!deselect) {
			getWalkRoute(id)
				.then((geojson) => {
					setPositions(geojson.coordinates.map(([lng, lat]) => [lat, lng]));
				})
				.catch(() => setMapError("No route recorded"));
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
