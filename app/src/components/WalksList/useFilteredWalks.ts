import type { Walk } from "@pedgehog/shared";
import {
	differenceInMinutes,
	formatDuration,
	intervalToDuration,
} from "date-fns";
import { useMemo } from "react";
import type { AppEvent } from "../../api";
import type { WalkFilter } from "./walksListFilter";
import { getFilterRange } from "./walksListFilter";

type FilteredWalksResult = {
	filteredWalks: Walk[];
	summary: string; // e.g. 1.5km · 1 hour 5 minutes  ·  3 🐕 1 🐈
};

export function useFilteredWalks(
	walks: Walk[],
	allEvents: AppEvent[],
	filter: WalkFilter,
): FilteredWalksResult {
	return useMemo(() => {
		const { start, end } = getFilterRange(filter);
		const filteredWalks = walks.filter((w) => {
			const d = new Date(w.started_at);
			return d >= start && d <= end;
		});

		const totalDistance = filteredWalks.reduce(
			(sum, w) => sum + (w.distance ?? 0),
			0,
		);
		const totalMinutes = filteredWalks.reduce((sum, w) => {
			if (!w.ended_at) return sum;
			return (
				sum + differenceInMinutes(new Date(w.ended_at), new Date(w.started_at))
			);
		}, 0);
		const totalTime =
			totalMinutes < 1 && totalMinutes > 0
				? "< 1 min"
				: formatDuration(
						intervalToDuration({ start: 0, end: totalMinutes * 60 * 1000 }),
						{ format: ["hours", "minutes"] },
					) || "0 min";

		const walkIds = new Set(filteredWalks.map((w) => w.id));
		const filteredEvents = allEvents.filter(
			(e) => e.walk_id && walkIds.has(e.walk_id),
		);
		const totalDogs = filteredEvents.filter(
			(e) => e.type === "dog_encounter",
		).length;
		const totalCats = filteredEvents.filter(
			(e) => e.type === "cat_encounter",
		).length;
		const totalBirds = filteredEvents.filter(
			(e) => e.type === "bird_encounter",
		).length;

		const distStr =
			totalDistance >= 1000
				? `${(totalDistance / 1000).toFixed(1)}km`
				: `${Math.round(totalDistance)}m`;

		let summary = `${distStr} · ${totalTime}`;
		if (totalDogs > 0) summary += `  ·  ${totalDogs} 🐕`;
		if (totalCats > 0) summary += ` ${totalCats} 🐈`;
		if (totalBirds > 0) summary += ` ${totalBirds} 🐦`;

		return { filteredWalks, summary };
	}, [walks, allEvents, filter]);
}
