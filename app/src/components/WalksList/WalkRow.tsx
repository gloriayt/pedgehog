import type { Walk } from "@pedgehog/shared";
import { format, isToday, isYesterday } from "date-fns";
import type { AppEvent } from "../../api";
import binImg from "../../assets/bin.webp";
import penImg from "../../assets/pen.webp";
import { eventEmoji, getWalkDuration } from "../../helpers";

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

	const EMOJI_TYPES = [
		"dog_encounter",
		"cat_encounter",
		"bird_encounter",
		"scavenge",
		"compliment",
	];
	const typeCounts = events.reduce((acc, e) => {
		if (EMOJI_TYPES.includes(e.type))
			acc.set(e.type, (acc.get(e.type) ?? 0) + 1);
		return acc;
	}, new Map<string, number>());

	return (
		<button
			type="button"
			className={`ds-walk-row${selected ? " ds-walk-row-selected" : ""}`}
			onClick={onSelect}
		>
			<div className="ds-walk-left">
				<div className="ds-walk-date">
					{dateLabel}
					{[...typeCounts].map(
						([type, count]) =>
							" " + Array(count).fill(eventEmoji(type)).join(" "),
					)}
				</div>
				<div className="ds-walk-suburb">
					{w.suburb ?? "Unknown"}
					{w.distance ? ` · ${Math.round(w.distance)}m` : ""}
					{" · "}
					{duration}
				</div>
			</div>
			{routeColour === "none" ? (
				<span className="ds-route-dot ds-route-none">✕</span>
			) : routeColour ? (
				<span className="ds-route-dot" style={{ background: routeColour }} />
			) : null}
			<button
				type="button"
				className="ds-walk-notes-btn"
				onClick={(e) => {
					e.stopPropagation();
					onEditNotes();
				}}
			>
				<img src={penImg} alt="Notes" className="ds-walk-action-icon" />
			</button>
			<button
				type="button"
				className="ds-walk-delete"
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
