import type { Walk } from "@pedgehog/shared";
import { format, formatDuration, intervalToDuration } from "date-fns";
import { useEffect, useState } from "react";
import { getWalks } from "./api";
import pawImg from "./assets/icon-paw.webp";
import idleImg from "./assets/pretzel-idle.webp";
import DsShell from "./DsShell";

function WalksList({ onBack }: { onBack: () => void }) {
	const [walks, setWalks] = useState<Walk[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		getWalks()
			.then(setWalks)
			.catch(() => setError("Could not load walks"))
			.finally(() => setLoading(false));
	}, []);

	return (
		<DsShell
			sprite={idleImg}
			bottom={
				<>
					<div className="ds-speech">Past walks</div>

					{loading && <div className="ds-speech">Loading...</div>}
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
								<div key={w.id} className="ds-walk-row">
									<div className="ds-walk-date">
										<img className="ds-icon ds-icon-xs" src={pawImg} alt="" />
										{format(new Date(w.started_at), "EEE d MMM")}
									</div>
									<div className="ds-walk-details">
										{duration}
										{w.distance ? ` · ${Math.round(w.distance)}m` : ""}
									</div>
									<div className="ds-walk-suburb">{w.suburb ?? "Unknown"}</div>
								</div>
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
