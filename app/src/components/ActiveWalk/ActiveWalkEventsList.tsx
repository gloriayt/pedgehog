import { format } from "date-fns";
import type { StressorEvent } from "../../api";

type Props = {
	events: StressorEvent[];
	onAdd: () => void;
};

function ActiveWalkEventsList({ events, onAdd }: Props) {
	return (
		<div className="ds-events-list">
			{events.map((e) => (
				<div key={e.id} className="ds-event-row">
					<span className="ds-event-emoji">
						{e.type === "cat_encounter" ? "🐈" : "🐕"}
					</span>
					<div className="ds-event-info">
						<div>
							{e.label}
							{e.intensity ? ` (${e.intensity}/5)` : ""}
							{" · "}
							{format(new Date(e.occurred_at), "h:mma")}
						</div>
						{e.notes && <div className="ds-event-notes">{e.notes}</div>}
					</div>
				</div>
			))}
			<button type="button" className="ds-btn-sm" onClick={onAdd} style={{ marginTop: 4 }}>
				+ ADD EVENT
			</button>
		</div>
	);
}

export default ActiveWalkEventsList;
