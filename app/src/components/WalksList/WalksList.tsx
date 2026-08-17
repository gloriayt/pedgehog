import type { Walk } from "@pedgehog/shared";
import { type ReactNode, useEffect, useState } from "react";
import {
	deleteWalk,
	getAllStressorEvents,
	getStressorEvents,
	getWalkRoute,
	getWalks,
	type StressorEvent,
} from "../../api";
import idleImg from "../../assets/pretzel-idle.webp";
import DsShell from "../DsShell";
import Loader from "../Loader";
import { useFilteredWalks } from "./useFilteredWalks";
import WalkDeleteConfirm from "./WalkDeleteConfirm";
import WalkMap from "./WalkMap";
import WalkRow from "./WalkRow";
import { FILTER_LABELS, type WalkFilter } from "./walksListFilter";

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
	const [filter, setFilter] = useState<WalkFilter>("this_week");

	useEffect(() => {
		getWalks()
			.then(setWalks)
			.catch(() => setError("Could not load walks"))
			.finally(() => setLoading(false));
		getAllStressorEvents()
			.then(setAllEvents)
			.catch(() => {});
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

	const { filteredWalks, summary } = useFilteredWalks(walks, allEvents, filter);

	let topContent: ReactNode;
	if (selectedId && positions) {
		topContent = (
			<WalkMap walkId={selectedId} positions={positions} events={events} />
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
							{loading ? <Loader /> : summary}
						</div>
						<div className="ds-header-actions">
							<select
								className="ds-select ds-select-sm"
								value={filter}
								onChange={(e) => setFilter(e.target.value as WalkFilter)}
							>
								{Object.entries(FILTER_LABELS).map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
							<button type="button" className="ds-btn-sm" onClick={onBack}>
								BACK
							</button>
						</div>
					</div>

					{loading && (
						<div className="ds-speech">
							<Loader />
						</div>
					)}
					{error && <div className="ds-error">{error}</div>}

					<div className="ds-walks-list">
						{filteredWalks.map((w) => (
							<WalkRow
								key={w.id}
								walk={w}
								selected={selectedId === w.id}
								events={allEvents.filter((e) => e.walk_id === w.id)}
								onSelect={() => selectWalk(w.id)}
								onDelete={() => setConfirmDeleteId(w.id)}
							/>
						))}
					</div>

					{confirmDeleteId && (
						<WalkDeleteConfirm
							onConfirm={() => handleDelete(confirmDeleteId)}
							onCancel={() => setConfirmDeleteId(null)}
						/>
					)}
				</>
			}
		/>
	);
}

export default WalksList;
