import type { Walk } from "@pedgehog/shared";
import {
	differenceInMinutes,
	format,
	formatDuration,
	intervalToDuration,
} from "date-fns";
import { useEffect, useState } from "react";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getWalkRoute, getWalks } from "./api";
import idleImg from "./assets/pretzel-idle.webp";
import DsShell, { Loader } from "./DsShell";

function WalksList({ onBack }: { onBack: () => void }) {
	const [walks, setWalks] = useState<Walk[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [positions, setPositions] = useState<[number, number][] | null>(null);
	const [mapError, setMapError] = useState<string | null>(null);

	useEffect(() => {
		getWalks()
			.then(setWalks)
			.catch(() => setError("Could not load walks"))
			.finally(() => setLoading(false));
	}, []);

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
		return sum + differenceInMinutes(new Date(w.ended_at), new Date(w.started_at));
	}, 0);
	const totalTime = totalMinutes < 1 && totalMinutes > 0
		? "< 1 min"
		: formatDuration(
				intervalToDuration({ start: 0, end: totalMinutes * 60 * 1000 }),
				{ format: ["hours", "minutes"] },
			) || "0 min";

	let topContent: React.ReactNode;
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
		topContent = <div className="ds-speech">{mapError ?? "Loading map..."}</div>;
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
						<div className="ds-speech">
							{selectedId ? "Walk route" : "Past walks"}
						</div>
						{loading ? (
							<div className="ds-stats-inline"><Loader /></div>
						) : walks.length > 0 ? (
							<div className="ds-stats-inline">
								TOTAL{" "}
								{totalDistance >= 1000
									? `${(totalDistance / 1000).toFixed(1)}km`
									: `${Math.round(totalDistance)}m`}
								{" · "}
								{totalTime}
							</div>
						) : null}
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
								? formatDuration(
										intervalToDuration({
											start: new Date(w.started_at),
											end: new Date(w.ended_at),
										}),
										{ format: ["hours", "minutes"] },
									) || "< 1 min"
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
										</div>
									</div>
									<div className="ds-walk-duration">{duration}</div>
								</button>
							);
						})}
					</div>

					<button type="button" className="ds-btn-sm" onClick={onBack}>
						BACK
					</button>
				</>
			}
		/>
	);
}

export default WalksList;
