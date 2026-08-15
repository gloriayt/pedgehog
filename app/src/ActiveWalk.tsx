import { secondsToMilliseconds } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { endWalk, logPoint } from "./api";
import homeImg from "./assets/icon-home.webp";
import walkImg from "./assets/pretzel-walk.webp";
import DsShell from "./DsShell";

type Props = { walkId: number; onEnd: () => void };

const GPS_THROTTLE_MS = secondsToMilliseconds(5);

function ActiveWalk({ walkId, onEnd }: Props) {
	const [pointCount, setPointCount] = useState(0);
	const [gpsError, setGpsError] = useState<string | null>(
		!navigator.geolocation ? "No GPS" : null,
	);
	const [ending, setEnding] = useState(false);
	const lastSentRef = useRef(0);

	useEffect(() => {
		if (!navigator.geolocation) return;

		const watchId = navigator.geolocation.watchPosition(
			(position) => {
				const now = Date.now();
				if (now - lastSentRef.current < GPS_THROTTLE_MS) return;
				lastSentRef.current = now;

				const { latitude, longitude } = position.coords;
				logPoint(walkId, latitude, longitude)
					.then(() => setPointCount((c) => c + 1))
					.catch(() => setGpsError("GPS lost"));
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
					<div className="ds-stat">
						<div className="ds-stat-val">{pointCount}</div>
						<div className="ds-stat-lbl">GPS POINTS</div>
					</div>

					{gpsError && <div className="ds-error">{gpsError}</div>}

					<button
						type="button"
						className="ds-btn ds-btn-stop"
						onClick={handleEnd}
						disabled={ending}
					>
						<img className="ds-icon ds-icon-sm" src={homeImg} alt="" />
						{ending ? "ENDING..." : "GO HOME"}
					</button>
				</>
			}
		/>
	);
}

export default ActiveWalk;
