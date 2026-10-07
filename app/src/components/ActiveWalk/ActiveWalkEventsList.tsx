import { format } from "date-fns";
import type { AppEvent } from "../../api";
import { getEventTypeEmoji } from "../../helpers";

type Props = {
	events: AppEvent[];
	onAdd: () => void;
	onEdit: (event: AppEvent) => void;
	onDelete: (id: number) => void;
};

function ActiveWalkEventsList({ events, onAdd, onEdit, onDelete }: Props) {
	return (
		<div className="events-list">
			{events.map((e) => (
				<div key={e.id} className="event-row">
					<span className="event-emoji">
						{getEventTypeEmoji(e.type)}
					</span>
					<div className="event-info">
						<div>
							{e.label}
							{e.intensity ? ` (${e.intensity}/5)` : ""}
							{" · "}
							{format(new Date(e.occurred_at), "h:mma")}
						</div>
						{e.notes && <div className="event-notes">{e.notes}</div>}
					</div>
					<div className="event-actions">
						<button
							type="button"
							className="event-action"
							onClick={() => onEdit(e)}
						>
							EDIT
						</button>
						<button
							type="button"
							className="event-action event-action-delete"
							onClick={() => onDelete(e.id)}
						>
							X
						</button>
					</div>
				</div>
			))}
			<button
				type="button"
				className="btn-sm"
				onClick={onAdd}
				style={{ marginTop: 4 }}
			>
				+ ADD EVENT
			</button>
		</div>
	);
}

export default ActiveWalkEventsList;
