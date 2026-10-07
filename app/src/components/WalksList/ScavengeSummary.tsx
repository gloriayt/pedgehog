import type { AppEvent } from "@pedgehog/shared";
import { differenceInCalendarDays } from "date-fns";

export function ScavengeSummary(allEvents: AppEvent[]) {
	const scavenges: AppEvent[] = allEvents
		.filter((e) => e.type === "scavenge")
		.sort(
			(a, b) =>
				new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
		);

	const lastScavenge: AppEvent | undefined = scavenges[0];

	if (!lastScavenge) {
		return <div className="top-pill speech">No scavenges recorded</div>;
	}

	const daysSinceLast = lastScavenge
		? differenceInCalendarDays(new Date(), new Date(lastScavenge.occurred_at))
		: null;

	return (
		<details className="top-pill speech">
			<summary>stats</summary>
			<div>days since last scavenge: {daysSinceLast}</div>
		</details>
	);
}
