import {
	endOfWeek,
	startOfDay,
	startOfMonth,
	startOfWeek,
	subWeeks,
} from "date-fns";

export type WalkFilter =
	| "today"
	| "this_week"
	| "last_week"
	| "this_month"
	| "all";

export const FILTER_LABELS: Record<WalkFilter, string> = {
	today: "Today",
	this_week: "This week",
	last_week: "Last week",
	this_month: "This month",
	all: "All time",
};

export const FILTER_EMPTY: Record<WalkFilter, string> = {
	today: "No walks today yet!",
	this_week: "No walks this week yet!",
	last_week: "No walks last week!",
	this_month: "No walks this month yet!",
	all: "No walks yet!",
};

const WEEK_OPTS = { weekStartsOn: 1 as const };

export function getFilterRange(filter: WalkFilter): { start: Date; end: Date } {
	const now = new Date();
	switch (filter) {
		case "today":
			return { start: startOfDay(now), end: now };
		case "this_week":
			return { start: startOfWeek(now, WEEK_OPTS), end: now };
		case "last_week":
			return {
				start: startOfWeek(subWeeks(now, 1), WEEK_OPTS),
				end: endOfWeek(subWeeks(now, 1), WEEK_OPTS),
			};
		case "this_month":
			return { start: startOfMonth(now), end: now };
		case "all":
			return { start: new Date(0), end: now };
	}
}
