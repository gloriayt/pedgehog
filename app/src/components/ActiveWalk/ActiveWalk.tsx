import { useEffect, useRef, useState } from "react";
import {
	type AppEvent,
	deleteEvent,
	deleteWalk,
	endWalk,
	getEvents,
	logPoint,
} from "../../api";
import binImg from "../../assets/bin.webp";
import homeImg from "../../assets/icon-home.webp";
import walkImg from "../../assets/pretzel-walk.webp";
import { haversine } from "../../helpers";
import DsShell from "../DsShell";
import ErrorBanner from "../Error";
import Loader from "../Loader";
import Popup from "../Popup";
import ActiveWalkEventsList from "./ActiveWalkEventsList";
import AddEventForm from "./AddEventForm";

type Props = { walkId: number; onEnd: () => void };

const GPS_THROTTLE_MS = 1_000;

function ActiveWalk({ walkId, onEnd }: Props) {
	const [gpsError, setGpsError] = useState<string | null>(
		!navigator.geolocation ? "No GPS" : null,
	);
	const [ending, setEnding] = useState(false);
	const [elapsed, setElapsed] = useState(0);
	const [distance, setDistance] = useState(0);
	const [walkNotes, setWalkNotes] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
	const [showEndConfirm, setShowEndConfirm] = useState(false);
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);
	const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
	const [events, setEvents] = useState<AppEvent[]>([]);
	const lastSentRef = useRef(0);
	const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

	useEffect(() => {
		const id = setInterval(() => setElapsed((s) => s + 1), 1000);
		return () => clearInterval(id);
	}, []);

	useEffect(() => {
		if (!navigator.geolocation) return;

		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				const now = Date.now();
				if (now - lastSentRef.current < GPS_THROTTLE_MS) return;
				lastSentRef.current = now;

				const { latitude: lat, longitude: lng } = position.coords;
				const pos = { lat, lng };
				const prev = lastPosRef.current;
				if (prev) {
					setDistance((d) => d + haversine(prev, pos));
				}
				lastPosRef.current = pos;
				logPoint(walkId, lat, lng).catch(() => setGpsError("GPS lost"));
			},
			(error) => {
				if (error.code === error.PERMISSION_DENIED) {
					setGpsError("GPS denied");
				} else {
					setGpsError("GPS error");
				}
			},
			{ enableHighAccuracy: true, maximumAge: 0 },
		);

		return () => navigator.geolocation.clearWatch(watchId);
	}, [walkId]);

	const refreshEvents = () => {
		getEvents(walkId).then(setEvents).catch(() => {});
	};

	const handleDeleteEvent = async (id: number) => {
		await deleteEvent(id);
		refreshEvents();
	};

	const handleEnd = async () => {
		setEnding(true);
		try {
			await endWalk(walkId, { notes: walkNotes || undefined });
			onEnd();
		} catch (e) {
			setGpsError(`End failed: ${(e as Error).message}`);
			setEnding(false);
		}
	};

	const handleCancel = async () => {
		try {
			await deleteWalk(walkId);
			onEnd();
		} catch (e) {
			setGpsError(`Cancel failed: ${(e as Error).message}`);
		}
	};

	return (
		<DsShell
			sprite={walkImg}
			walking
			listLayout
			bottom={({ scavengeParty }) => (
				<>
					<div className="ds-stats-row ds-stats-compact">
						<div className="ds-stat">
							<div className="ds-stat-val">
								{String(Math.floor(elapsed / 60)).padStart(2, "0")}:
								{String(elapsed % 60).padStart(2, "0")}
							</div>
							<div className="ds-stat-lbl">TIME</div>
						</div>
						<div className="ds-stat">
							<div className="ds-stat-val">{Math.round(distance)}</div>
							<div className="ds-stat-lbl">DIST</div>
						</div>
						<button
							type="button"
							className="ds-btn ds-btn-go ds-btn-compact"
							onClick={() => setShowEndConfirm(true)}
							disabled={ending}
						>
							{ending ? (
								<Loader />
							) : (
								<img
									className="ds-icon"
									src={homeImg}
									alt="Save"
									style={{ width: 20, height: 20 }}
								/>
							)}
						</button>
						<button
							type="button"
							className="ds-btn ds-btn-stop ds-btn-compact"
							onClick={() => setShowCancelConfirm(true)}
						>
							<img
								className="ds-icon"
								src={binImg}
								alt="Cancel"
								style={{ width: 20, height: 20 }}
							/>
						</button>
					</div>

					{gpsError && <ErrorBanner message={gpsError} onDismiss={() => setGpsError(null)} />}

					<ActiveWalkEventsList
						events={events}
						onAdd={() => {
							setEditingEvent(null);
							setShowForm(true);
						}}
						onEdit={(event) => {
							setEditingEvent(event);
							setShowForm(true);
						}}
						onDelete={(id) => setDeleteEventId(id)}
					/>

					{showForm && (
						<AddEventForm
							walkId={walkId}
							getPosition={() => lastPosRef.current}
							editing={editingEvent ?? undefined}
							onSave={(eventType) => {
								refreshEvents();
								setShowForm(false);
								setEditingEvent(null);
								if (eventType === "scavenge") scavengeParty();
							}}
							onCancel={() => {
								setShowForm(false);
								setEditingEvent(null);
							}}
						/>
					)}

					{showEndConfirm && (
						<Popup
							message="Save walk?"
							confirmLabel="yes pls!"
							cancelLabel="not yet"
							confirmStyle="ds-btn-sm ds-btn-sm-go"
							onConfirm={() => {
								setShowEndConfirm(false);
								handleEnd();
							}}
							onCancel={() => setShowEndConfirm(false)}
						>
							<textarea
								className="ds-textarea"
								placeholder="Walk notes (optional)"
								value={walkNotes}
								onChange={(e) => setWalkNotes(e.target.value)}
								rows={2}
							/>
						</Popup>
					)}

					{showCancelConfirm && (
						<Popup
							message="Cancel walk?"
							confirmLabel="yes"
							cancelLabel="no"
							onConfirm={() => {
								setShowCancelConfirm(false);
								handleCancel();
							}}
							onCancel={() => setShowCancelConfirm(false)}
						/>
					)}

					{deleteEventId && (
						<Popup
							message="Delete event?"
							onConfirm={() => {
								handleDeleteEvent(deleteEventId);
								setDeleteEventId(null);
							}}
							onCancel={() => setDeleteEventId(null)}
						/>
					)}
				</>
			)}
		/>
	);
}

export default ActiveWalk;
