import type { Walk } from "@pedgehog/shared";
import { differenceInCalendarDays } from "date-fns";
import { type ReactNode, useEffect, useState } from "react";
import {
	type AppEvent,
	deleteWalk,
	getAllEvents,
	getWalkRoute,
	getWalks,
	updateWalkNotes,
} from "../../api";
import homeImg from "../../assets/icon-home.webp";
import idleImg from "../../assets/pretzel-idle.webp";
import DsShell from "../DsShell";
import ErrorBanner from "../Error";
import Loader from "../Loader";
import Popup from "../Popup";
import { useFilteredWalks } from "./useFilteredWalks";
import WalkDeleteConfirm from "./WalkDeleteConfirm";
import WalkMap, { type Route as MapRoute, ROUTE_COLOURS } from "./WalkMap";
import WalkRow from "./WalkRow";
import {
	FILTER_EMPTY,
	FILTER_LABELS,
	type WalkFilter,
} from "./walksListFilter";

type CachedRoute = { positions: [number, number][] };

function WalksList({ onBack }: { onBack: () => void }) {
	const [walks, setWalks] = useState<Walk[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [routes, setRoutes] = useState<Map<number, CachedRoute>>(new Map());
	const [routeColourMap, setRouteColourMap] = useState<Map<number, string>>(
		new Map(),
	);
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
	const [editNotesWalk, setEditNotesWalk] = useState<Walk | null>(null);
	const [editNotesText, setEditNotesText] = useState("");
	const [allEvents, setAllEvents] = useState<AppEvent[]>([]);
	const [filter, setFilter] = useState<WalkFilter>("this_week");

	useEffect(() => {
		getWalks()
			.then(setWalks)
			.catch(() => setError("Could not load walks"))
			.finally(() => setLoading(false));
		getAllEvents()
			.then(setAllEvents)
			.catch(() => {});
	}, []);

	const assignColour = (id: number) => {
		setRouteColourMap((prev) => {
			if (prev.has(id)) return prev;
			const used = new Set(prev.values());
			const colour =
				ROUTE_COLOURS.find((c) => !used.has(c)) ?? ROUTE_COLOURS[0];
			return new Map(prev).set(id, colour);
		});
	};

	const fetchRoute = (id: number) => {
		const cached = routes.get(id);
		if (cached) {
			if (cached.positions.length > 0) assignColour(id);
			return;
		}
		getWalkRoute(id)
			.then((geojson) => {
				const positions = geojson.coordinates.map(
					([lng, lat]) => [lat, lng] as [number, number],
				);
				setRoutes((prev) => new Map(prev).set(id, { positions }));
				if (positions.length > 0) assignColour(id);
			})
			.catch(() => {
				setRoutes((prev) => new Map(prev).set(id, { positions: [] }));
			});
	};

	const handleDelete = async (id: number) => {
		try {
			await deleteWalk(id);
			setWalks((w) => w.filter((walk) => walk.id !== id));
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		} catch {
			setError("Could not delete walk");
		}
		setConfirmDeleteId(null);
	};

	const toggleWalk = (id: number) => {
		const deselecting = selectedIds.has(id);
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (deselecting) next.delete(id);
			else next.add(id);
			return next;
		});

		if (deselecting) {
			setRouteColourMap((prev) => {
				const next = new Map(prev);
				next.delete(id);
				return next;
			});
		} else {
			fetchRoute(id);
		}
	};

	const toggleAll = () => {
		if (selectedIds.size === filteredWalks.length) {
			setSelectedIds(new Set());
			setRouteColourMap(new Map());
			return;
		}
		setSelectedIds(new Set(filteredWalks.map((w) => w.id)));
		for (const w of filteredWalks) fetchRoute(w.id);
		getAllEvents()
			.then(setAllEvents)
			.catch(() => {});
	};

	const { filteredWalks, summary } = useFilteredWalks(walks, allEvents, filter);

	const selectedIdList = [...selectedIds];
	const selectedRoutes: MapRoute[] = selectedIdList
		.map((id) => {
			const r = routes.get(id);
			if (!r || r.positions.length === 0) return null;
			return {
				positions: r.positions,
				colour: routeColourMap.get(id) ?? ROUTE_COLOURS[0],
			};
		})
		.filter((r): r is MapRoute => r !== null);

	const selectedEvents =
		selectedIds.size > 0
			? allEvents.filter((e) => e.walk_id && selectedIds.has(e.walk_id))
			: [];

	const getRouteColour = (id: number): string | undefined => {
		if (selectedIds.size <= 1 || !selectedIds.has(id)) return undefined;
		return routeColourMap.get(id) ??
			(routes.get(id)?.positions.length === 0 ? "none" : undefined);
	};

	let topContent: ReactNode;
	if (selectedIds.size > 0 && selectedRoutes.length > 0) {
		topContent = (
			<WalkMap
				mapKey={selectedIdList
					.filter((id) => routes.get(id)?.positions.length)
					.join("-")}
				routes={selectedRoutes}
				events={selectedEvents}
			/>
		);
	} else if (selectedIds.size > 0) {
		const anyPending = selectedIdList.some((id) => !routes.has(id));
		topContent = (
			<div className="ds-speech">
				{anyPending ? "Loading routes..." : "No routes available"}
			</div>
		);
	} else {
		const lastScavenge = allEvents
			.filter((e) => e.type === "scavenge")
			.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0];
		const daysSince = lastScavenge
			? differenceInCalendarDays(new Date(), new Date(lastScavenge.occurred_at))
			: null;

		topContent = (
			<div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
				{daysSince !== null && (
					<div className="ds-speech">Days since scavenge: {daysSince}</div>
				)}
				<div className="ds-speech">Select a walk</div>
			</div>
		);
	}

	return (
		<DsShell
			sprite={idleImg}
			top={topContent}
			listLayout
			onButtonPress={toggleAll}
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
								<img
									className="ds-icon"
									src={homeImg}
									alt="Back"
									style={{ width: 15, height: 15 }}
								/>
							</button>
						</div>
					</div>

					{loading && (
						<div className="ds-speech">
							<Loader />
						</div>
					)}
					{error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

					<div className="ds-walks-list">
						{!loading && filteredWalks.length === 0 && (
							<div className="ds-empty">
								<div className="ds-speech">{FILTER_EMPTY[filter]}</div>
							</div>
						)}
						{filteredWalks.map((w) => (
							<WalkRow
								key={w.id}
								walk={w}
								selected={selectedIds.has(w.id)}
								events={allEvents.filter((e) => e.walk_id === w.id)}
								routeColour={getRouteColour(w.id)}
								onSelect={() => toggleWalk(w.id)}
								onDelete={() => setConfirmDeleteId(w.id)}
								onEditNotes={() => {
									setEditNotesWalk(w);
									setEditNotesText(w.notes ?? "");
								}}
							/>
						))}
					</div>

					{confirmDeleteId && (
						<WalkDeleteConfirm
							onConfirm={() => handleDelete(confirmDeleteId)}
							onCancel={() => setConfirmDeleteId(null)}
						/>
					)}

					{editNotesWalk && (
						<Popup
							message={editNotesWalk.notes ? "Edit notes" : "Add notes"}
							confirmLabel="save"
							confirmStyle="ds-btn-sm ds-btn-sm-go"
							cancelLabel="cancel"
							onConfirm={async () => {
								await updateWalkNotes(editNotesWalk.id, editNotesText);
								setWalks((prev) =>
									prev.map((w) =>
										w.id === editNotesWalk.id ? { ...w, notes: editNotesText || null } : w,
									),
								);
								setEditNotesWalk(null);
							}}
							onCancel={() => setEditNotesWalk(null)}
						>
							<textarea
								className="ds-textarea"
								value={editNotesText}
								onChange={(e) => setEditNotesText(e.target.value)}
								rows={3}
							/>
						</Popup>
					)}
				</>
			}
		/>
	);
}

export default WalksList;
