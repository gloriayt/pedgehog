import { formatDuration, intervalToDuration } from "date-fns";

export function randomAround(center: number, range: number) {
	return center + (Math.random() - 0.5) * range;
}

/** Returns a short walk duration string like "1hr 23min". */
export function getWalkDuration(
	startedAt: string,
	endedAt: string | null,
): string {
	if (!endedAt) return "in progress";
	return (
		formatDuration(
			intervalToDuration({
				start: new Date(startedAt),
				end: new Date(endedAt),
			}),
			{ format: ["hours", "minutes"] },
		) || "< 1 min"
	)
		.replace(/ hours?/g, "hr")
		.replace(/ minutes?/g, "min");
}

/** Returns the distance in metres between two lat/lng points. */
export function haversine(
	a: { lat: number; lng: number },
	b: { lat: number; lng: number },
) {
	const R = 6371000;
	const toRad = (d: number) => (d * Math.PI) / 180;

	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);

	const s =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

	return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
