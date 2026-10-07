import type { EventTypes, Walk } from "@pedgehog/shared";
import { format, isToday, isYesterday } from "date-fns";
import type { AppEvent } from "../../api";
import binImg from "../../assets/bin.webp";
import penImg from "../../assets/pen.webp";
import { getEventTypeEmoji, getWalkDuration } from "../../helpers";

type Props = {
	walk: Walk;
	selected: boolean;
	events: AppEvent[];
	routeColour?: string | "none";
	onSelect: () => void;
	onDelete: () => void;
	onEditNotes: () => void;
};

function WalkRow({
	walk: w,
	selected,
	events,
	routeColour,
	onSelect,
	onDelete,
	onEditNotes,
}: Props) {
	const duration = getWalkDuration(w.started_at, w.ended_at);
	const startDate = new Date(w.started_at);
	const time = format(startDate, "h:mma");
	const dateLabel = isToday(startDate)
		? `Today ${time}`
		: isYesterday(startDate)
			? `Yesterday ${time}`
			: format(startDate, "EEE d MMM h:mma");

	const typeCounts = events.reduce((acc, e) => {
		acc.set(e.type, (acc.get(e.type) ?? 0) + 1);
		return acc;
	}, new Map<EventTypes, number>());

	return (
		<button
			type="button"
			className={`walk-row${selected ? " walk-row-selected" : ""}`}
			onClick={onSelect}
		>
			<div className="walk-left">
				<div className="walk-date">
					{dateLabel}
					{[...typeCounts].map(
						([type, count]) =>
							` ${Array(count).fill(getEventTypeEmoji(type)).join(" ")}`,
					)}
				</div>
				<div className="walk-suburb">
					{w.suburb ?? "Unknown"}
					{w.distance ? ` · ${Math.round(w.distance)}m` : ""}
					{" · "}
					{duration}
				</div>
			</div>

			{routeColour === "none" ? (
				<span className="route-dot route-none">✕</span>
			) : routeColour ? (
				<span className="route-dot" style={{ background: routeColour }} />
			) : null}

			<button
				type="button"
				className="walk-notes-btn"
				onClick={(e) => {
					e.stopPropagation();
					onEditNotes();
				}}
			>
				<img src={penImg} alt="Notes" className="walk-action-icon" />
			</button>
			<button
				type="button"
				className="walk-delete"
				onClick={(e) => {
					e.stopPropagation();
					onDelete();
				}}
			>
				<img src={binImg} alt="Delete" />
			</button>
		</button>
	);
}

export default WalkRow;
