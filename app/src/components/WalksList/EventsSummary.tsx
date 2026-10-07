import type { AppEvent } from "@pedgehog/shared";
import { differenceInCalendarDays } from "date-fns";

export function EventsSummary(allEvents: AppEvent[]) {
	const scavenges: AppEvent[] = allEvents
		.filter((e) => e.type === "scavenge")
		.sort(
			(a, b) =>
				new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
		);
	const compliments: AppEvent[] = allEvents
		.filter((e) => e.type === "compliment")
		.filter((c) => !!c.notes && c.notes.length > 0) // remove empty ones
		.sort(
			(a, b) =>
				new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
		);

	if (scavenges.length === 0 && compliments.length === 0) {
		return (
			<div className="top-pill speech">
				No scavenges or compliments recorded
			</div>
		);
	}

	const lastScavenge: AppEvent | undefined = scavenges[0];

	const daysSinceLast = lastScavenge
		? differenceInCalendarDays(new Date(), new Date(lastScavenge.occurred_at))
		: null;

	const totalDaysBetweenScavenges = scavenges.reduce((total, scavenge, i) => {
		if (i === 0) return 0;
		return (
			total +
			differenceInCalendarDays(
				new Date(scavenges[i - 1].occurred_at),
				new Date(scavenge.occurred_at),
			)
		);
	}, 0);

	const averageDaysBetweenScavenges =
		totalDaysBetweenScavenges / scavenges.length;

	return (
		<div
			className="top-pill"
			style={{ display: "flex", flexDirection: "column", gap: "6px" }}
		>
			<details className="speech">
				<summary>scavenges</summary>
				<div>total: {scavenges.length}</div>
				<div>days since last: {daysSinceLast}</div>
				{scavenges.length > 2 && (
					<div>avg. days between: {averageDaysBetweenScavenges}</div>
				)}
			</details>

			<details className="speech">
				<summary>compliments</summary>
				<div>total: {compliments.length}</div>
				{compliments.map((c) => (
					<div key={c.id}>{c.notes}</div>
				))}
			</details>
		</div>
	);
}
