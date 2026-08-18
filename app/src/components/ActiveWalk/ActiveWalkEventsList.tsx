import { format } from "date-fns";
import type { AppEvent } from "../../api";
import { eventEmoji } from "../../helpers";

type Props = {
	events: AppEvent[];
	onAdd: () => void;
	onEdit: (event: AppEvent) => void;
	onDelete: (id: number) => void;
};

function ActiveWalkEventsList({ events, onAdd, onEdit, onDelete }: Props) {
	return (
		<div className="ds-events-list">
			{events.map((e) => (
				<div key={e.id} className="ds-event-row">
					<span className="ds-event-emoji">
						{eventEmoji(e.type)}
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
					<div className="ds-event-actions">
						<button
							type="button"
							className="ds-event-action"
							onClick={() => onEdit(e)}
						>
							EDIT
						</button>
						<button
							type="button"
							className="ds-event-action ds-event-action-delete"
							onClick={() => onDelete(e.id)}
						>
							X
						</button>
					</div>
				</div>
			))}
			<button
				type="button"
				className="ds-btn-sm"
				onClick={onAdd}
				style={{ marginTop: 4 }}
			>
				+ ADD EVENT
			</button>
		</div>
	);
}

export default ActiveWalkEventsList;
