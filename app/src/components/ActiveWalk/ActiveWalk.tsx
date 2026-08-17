import { useEffect, useRef, useState } from "react";
import { endWalk, getStressorEvents, logPoint, type StressorEvent } from "../../api";
import homeImg from "../../assets/icon-home.webp";
import walkImg from "../../assets/pretzel-walk.webp";
import { haversine } from "../../helpers";
import DsShell from "../DsShell";
import Loader from "../Loader";
import ActiveWalkEventsList from "./ActiveWalkEventsList";
import StressorEventForm from "./StressorEventForm";

type Props = { walkId: number; onEnd: () => void };

const GPS_THROTTLE_MS = 1_000;

function ActiveWalk({ walkId, onEnd }: Props) {
	const [gpsError, setGpsError] = useState<string | null>(
		!navigator.geolocation ? "No GPS" : null,
	);
	const [ending, setEnding] = useState(false);
	const [elapsed, setElapsed] = useState(0);
	const [distance, setDistance] = useState(0);
	const [showLog, setShowLog] = useState(false);
	const [showEndConfirm, setShowEndConfirm] = useState(false);
	const [events, setEvents] = useState<StressorEvent[]>([]);
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
		getStressorEvents(walkId).then(setEvents).catch(() => {});
	};

	const handleEnd = async () => {
		setEnding(true);
		try {
			await endWalk(walkId);
			onEnd();
		} catch (e) {
			setGpsError(`End failed: ${(e as Error).message}`);
			setEnding(false);
		}
	};

	return (
		<DsShell
			sprite={walkImg}
			walking
			listLayout
			bottom={
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
							className="ds-btn ds-btn-stop ds-btn-compact"
							onClick={() => setShowEndConfirm(true)}
							disabled={ending}
						>
							{ending ? (
								<Loader />
							) : (
								<img className="ds-icon" src={homeImg} alt="Finish" style={{ width: 20, height: 20 }} />
							)}
						</button>
					</div>

					{gpsError && <div className="ds-error">{gpsError}</div>}

					<ActiveWalkEventsList
						events={events}
						onAdd={() => setShowLog(true)}
					/>

					{showLog && (
						<StressorEventForm
							walkId={walkId}
							getPosition={() => lastPosRef.current}
							onSave={() => {
								refreshEvents();
								setShowLog(false);
							}}
							onCancel={() => setShowLog(false)}
						/>
					)}

					{showEndConfirm && (
						<div className="ds-confirm-overlay">
							<div className="ds-confirm">
								<div className="ds-speech">End walk?</div>
								<div className="ds-btn-row">
									<button
										type="button"
										className="ds-btn ds-btn-stop"
										onClick={() => {
											setShowEndConfirm(false);
											handleEnd();
										}}
									>
										END
									</button>
									<button
										type="button"
										className="ds-btn ds-btn-secondary"
										onClick={() => setShowEndConfirm(false)}
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

export default ActiveWalk;
