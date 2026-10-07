import type { AppEvent } from "@pedgehog/shared";
import { differenceInCalendarDays, format } from "date-fns";

const byNewest = (a: AppEvent, b: AppEvent) =>
	new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();

export function EventsSummary(allEvents: AppEvent[]) {
	const scavenges = allEvents.filter((e) => e.type === "scavenge").sort(byNewest);
	const compliments = allEvents
		.filter((e) => e.type === "compliment" && e.notes)
		.sort(byNewest);

	if (scavenges.length === 0 && compliments.length === 0) {
		return (
			<div className="top-pill speech">
				No scavenges or compliments recorded
			</div>
		);
	}

	const lastScavenge = scavenges[0];

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

	const toggleDetails = (e: React.MouseEvent<HTMLDetailsElement>) => {
		e.preventDefault();
		e.currentTarget.toggleAttribute("open");
	};

	return (
		<div className="top-pill events-summary">
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: ignore keyboard */}
			<details className="speech scavenges-content" onClick={toggleDetails}>
				<summary>scavenges 👹</summary>
				<div className="details-content">
					<div>total: {scavenges.length}</div>
					<div>days since last: {daysSinceLast}</div>
					{scavenges.length > 2 && (
						<div>avg. days between: {averageDaysBetweenScavenges}</div>
					)}
				</div>
			</details>

			{/* biome-ignore lint/a11y/useKeyWithClickEvents: ignore keyboard */}
			<details className="speech" onClick={toggleDetails}>
				<summary>compliments 🌸</summary>
				<div className="details-content compliments-content">
					<div>total: {compliments.length}</div>
					{compliments.map((c) => (
						<div key={c.id}>
							{format(new Date(c.occurred_at), "d MMM")} · {c.notes}
						</div>
					))}
				</div>
			</details>
		</div>
	);
}
