import "dotenv/config";
import { pool } from "./db.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = `pedgehog-app (cleanup, contact: ${process.env.NOMINATIM_CONTACT})`;
const STALE_HOURS = 4;

async function reverseGeocode(
	lat: number,
	lng: number,
): Promise<string | null> {
	try {
		const res = await fetch(
			`${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json`,
			{
				headers: { "User-Agent": USER_AGENT },
			},
		);
		const data = await res.json();
		return (
			data.address?.suburb ||
			data.address?.village ||
			data.address?.town ||
			null
		);
	} catch {
		return null;
	}
}

async function fillSuburb(walkId: number) {
	const { rows } = await pool.query(
		`SELECT ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat
		 FROM walk_points WHERE walk_id = $1 ORDER BY recorded_at LIMIT 1`,
		[walkId],
	);
	if (!rows[0]) return;
	const suburb = await reverseGeocode(rows[0].lat, rows[0].lng);
	if (suburb) {
		await pool.query("UPDATE walks SET suburb = $1 WHERE id = $2", [
			suburb,
			walkId,
		]);
		console.log(`  suburb → ${suburb}`);
	}
	// Nominatim rate limit: 1 req/sec
	await new Promise((r) => setTimeout(r, 1100));
}

async function cleanup() {
	// 1. End stale walks
	const { rows: staleWalks } = await pool.query(
		`SELECT id FROM walks
		 WHERE ended_at IS NULL AND started_at < NOW() - INTERVAL '${STALE_HOURS} hours'`,
	);

	console.log(`Stale walks: ${staleWalks.length}`);

	for (const { id } of staleWalks) {
		await pool.query(
			`UPDATE walks SET ended_at = COALESCE(
				(SELECT MAX(recorded_at) FROM walk_points WHERE walk_id = $1),
				NOW()
			) WHERE id = $1`,
			[id],
		);

		await pool.query(
			`WITH line AS (
				SELECT ST_Simplify(ST_MakeLine(location::geometry ORDER BY recorded_at), 0.00005)::geography AS route
				FROM walk_points WHERE walk_id = $1
				HAVING COUNT(*) >= 2
			)
			UPDATE walks SET route = line.route, distance = ST_Length(line.route)
			FROM line WHERE walks.id = $1`,
			[id],
		);

		await fillSuburb(id);
		console.log(`Ended walk ${id}`);
	}

	// 2. Fill missing suburbs on all walks
	const { rows: missingSuburb } = await pool.query(
		`SELECT id FROM walks WHERE suburb IS NULL`,
	);

	console.log(`Missing suburbs: ${missingSuburb.length}`);

	for (const { id } of missingSuburb) {
		await fillSuburb(id);
		console.log(`Filled suburb for walk ${id}`);
	}

	await pool.end();
	console.log("Done");
}

cleanup();
