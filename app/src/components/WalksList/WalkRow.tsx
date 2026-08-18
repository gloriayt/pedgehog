import type { Walk } from "@pedgehog/shared";
import { format, isToday, isYesterday } from "date-fns";
import type { AppEvent } from "../../api";
import binImg from "../../assets/bin.webp";
import { eventEmoji, getWalkDuration } from "../../helpers";

type Props = {
	walk: Walk;
	selected: boolean;
	events: AppEvent[];
	routeColour?: string | "none";
	onSelect: () => void;
	onDelete: () => void;
};

function WalkRow({
	walk: w,
	selected,
	events,
	routeColour,
	onSelect,
	onDelete,
}: Props) {
	const duration = getWalkDuration(w.started_at, w.ended_at);
	const startDate = new Date(w.started_at);
	const time = format(startDate, "h:mma");
	const dateLabel = isToday(startDate)
		? `Today ${time}`
		: isYesterday(startDate)
			? `Yesterday ${time}`
			: format(startDate, "EEE d MMM h:mma");

	const counts = [
		{ type: "dog_encounter", count: events.filter((e) => e.type === "dog_encounter").length },
		{ type: "cat_encounter", count: events.filter((e) => e.type === "cat_encounter").length },
		{ type: "bird_encounter", count: events.filter((e) => e.type === "bird_encounter").length },
		{ type: "scavenging", count: events.filter((e) => e.type === "scavenging").length },
		{ type: "complimented", count: events.filter((e) => e.type === "complimented").length },
	].filter((c) => c.count > 0);

	return (
		<button
			type="button"
			className={`ds-walk-row${selected ? " ds-walk-row-selected" : ""}`}
			onClick={onSelect}
		>
			<div className="ds-walk-left">
				<div className="ds-walk-date">
					{dateLabel}
					{counts.map((c) => " " + Array(c.count).fill(eventEmoji(c.type)).join(" "))}
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
