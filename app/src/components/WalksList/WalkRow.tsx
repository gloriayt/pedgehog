import type { Walk } from "@pedgehog/shared";
import { format, isToday, isYesterday } from "date-fns";
import type { StressorEvent } from "../../api";
import binImg from "../../assets/bin.webp";
import { getWalkDuration } from "../../helpers";

type Props = {
	walk: Walk;
	selected: boolean;
	events: StressorEvent[];
	onSelect: () => void;
	onDelete: () => void;
};

function WalkRow({ walk: w, selected, events, onSelect, onDelete }: Props) {
	const duration = getWalkDuration(w.started_at, w.ended_at);
	const startDate = new Date(w.started_at);
	const time = format(startDate, "h:mma");
	const dateLabel = isToday(startDate)
		? `Today ${time}`
		: isYesterday(startDate)
			? `Yesterday ${time}`
			: format(startDate, "EEE d MMM h:mma");

	const dogs = events.filter((e) => e.type === "dog_encounter").length;
	const cats = events.filter((e) => e.type === "cat_encounter").length;

	return (
		<button
			type="button"
			className={`ds-walk-row${selected ? " ds-walk-row-selected" : ""}`}
			onClick={onSelect}
		>
			<div className="ds-walk-left">
				<div className="ds-walk-date">
					{dateLabel}
					{dogs > 0 && " " + Array(dogs).fill("🐕").join(" ")}
					{cats > 0 && " " + Array(cats).fill("🐈").join(" ")}
				</div>
				<div className="ds-walk-suburb">
					{w.suburb ?? "Unknown"}
					{w.distance ? ` · ${Math.round(w.distance)}m` : ""}
					{" · "}
					{duration}
				</div>
			</div>
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
