import type { AppEvent } from "@pedgehog/shared";
import { differenceInCalendarDays } from "date-fns";

export function ScavengeSummary(allEvents: AppEvent[]) {
	const lastScavenge = allEvents
		.filter((e) => e.type === "scavenge")
		.sort(
			(a, b) =>
				new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
		)[0];
	const daysSince = lastScavenge
		? differenceInCalendarDays(new Date(), new Date(lastScavenge.occurred_at))
		: null;

	if (daysSince === null) {
		return <div className="ds-top-pill ds-speech">No scavenges recorded</div>;
	}

	return (
		<div className="ds-top-pill ds-speech">
			Days since last scavenge: {daysSince}
		</div>
	);
}
