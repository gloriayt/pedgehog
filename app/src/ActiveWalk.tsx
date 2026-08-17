import { useEffect, useRef, useState } from "react";
import { endWalk, logPoint } from "./api";
import homeImg from "./assets/icon-home.webp";
import walkImg from "./assets/pretzel-walk.webp";
import DsShell, { Loader } from "./DsShell";
import { haversine } from "./helpers";
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
	const [logCount, setLogCount] = useState(0);
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
			bottom={
				<>
					<div className="ds-stats-row">
						<div className="ds-stat">
							<div className="ds-stat-val">
								{String(Math.floor(elapsed / 60)).padStart(2, "0")}:
								{String(elapsed % 60).padStart(2, "0")}
							</div>
							<div className="ds-stat-lbl">TIME</div>
						</div>
						<div className="ds-stat">
							<div className="ds-stat-val">{Math.round(distance)}</div>
							<div className="ds-stat-lbl">DISTANCE</div>
						</div>
						{logCount > 0 && (
							<div className="ds-stat">
								<div className="ds-stat-val">{logCount}</div>
								<div className="ds-stat-lbl">EVENTS</div>
							</div>
						)}
					</div>

					{gpsError && <div className="ds-error">{gpsError}</div>}

					<div className="ds-btn-row">
						<button
							type="button"
							className="ds-btn ds-btn-secondary"
							onClick={() => setShowLog(true)}
						>
							LOG EVENT
						</button>
						<button
							type="button"
							className="ds-btn ds-btn-stop"
							onClick={handleEnd}
							disabled={ending}
						>
							<img className="ds-icon ds-icon-sm" src={homeImg} alt="" />
							{ending ? <Loader /> : "FINISH"}
						</button>
					</div>

					{showLog && (
						<StressorEventForm
							walkId={walkId}
							getPosition={() => lastPosRef.current}
							onSave={() => {
								setLogCount((c) => c + 1);
								setShowLog(false);
							}}
							onCancel={() => setShowLog(false)}
						/>
					)}
				</>
			}
		/>
	);
}

export default ActiveWalk;
