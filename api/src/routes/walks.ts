import type { FastifyInstance } from "fastify";
import { EndWalkInput, StartWalkInput } from "@pedgehog/shared";
import { pool } from "../db.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = `pedgehog-app (personal project, contact: ${process.env.NOMINATIM_CONTACT})`;

export default async function walks(app: FastifyInstance) {
	app.post("/walks", async (req, reply) => {
		const parsed = StartWalkInput.safeParse(req.body);
		if (!parsed.success) {
			reply.code(400);
			return { error: parsed.error.flatten() };
		}
		const { dog_id } = parsed.data;
		const { rows } = await pool.query(
			"INSERT INTO walks (dog_id, started_at) VALUES ($1, NOW()) RETURNING *",
			[dog_id],
		);
		reply.code(201);
		return rows[0];
	});

	app.get("/walks", async (req) => {
		const { dog_id } = req.query as { dog_id?: string };
		const { rows } = await pool.query(
			dog_id
				? "SELECT * FROM walks WHERE dog_id = $1 ORDER BY started_at DESC"
				: "SELECT * FROM walks ORDER BY started_at DESC",
			dog_id ? [dog_id] : [],
		);
		return rows;
	});

	app.get("/walks/:id", async (req, reply) => {
		const { id } = req.params as { id: string };
		const { rows } = await pool.query("SELECT * FROM walks WHERE id = $1", [
			id,
		]);
		if (!rows[0]) {
			reply.code(404);
			return { error: "Walk not found" };
		}
		return rows[0];
	});

	app.patch("/walks/:id", async (req, reply) => {
		const { id } = req.params as { id: string };
		const parsed = EndWalkInput.safeParse(req.body);
		if (!parsed.success) {
			reply.code(400);
			return { error: parsed.error.flatten() };
		}
		const { stress_score } = parsed.data;

		await pool.query(
			"UPDATE walks SET ended_at = NOW(), stress_score = $2 WHERE id = $1",
			[id, stress_score ?? null],
		);

		await pool.query(
			`
			WITH line AS (
				SELECT ST_Simplify(ST_MakeLine(location::geometry ORDER BY recorded_at), 0.00005)::geography AS route
				FROM walk_points WHERE walk_id = $1
				HAVING COUNT(*) >= 2
			)
			UPDATE walks SET route = line.route, distance = ST_Length(line.route)
			FROM line WHERE walks.id = $1
			`,
			[id],
		);

		const { rows: firstPoint } = await pool.query(
			`SELECT ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat
			FROM walk_points WHERE walk_id = $1 ORDER BY recorded_at LIMIT 1`,
			[id],
		);

		if (firstPoint[0]) {
			const { lat, lng } = firstPoint[0];
			try {
				const geoRes = await fetch(
					`${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json`,
					{ headers: { "User-Agent": USER_AGENT } },
				);
				const geoData = await geoRes.json();
				const suburb =
					geoData.address?.suburb ||
					geoData.address?.village ||
					geoData.address?.town ||
					null;
				if (suburb) {
					await pool.query("UPDATE walks SET suburb = $1 WHERE id = $2", [
						suburb,
						id,
					]);
				}
			} catch (e) {
				console.log("Error fetching from Nominatim:", e);
			}
		}

		const { rows } = await pool.query("SELECT * FROM walks WHERE id = $1", [
			id,
		]);
		return rows[0];
	});

	app.post("/walks/:id/points", async (req, reply) => {
		const { id } = req.params as { id: string };
		const { lat, lng, recorded_at } = req.body as {
			lat: number;
			lng: number;
			recorded_at?: string;
		};

		const { rows } = await pool.query(
			`INSERT INTO walk_points (walk_id, location, recorded_at)
			VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, COALESCE($4, NOW()))
			RETURNING *`,
			[id, lng, lat, recorded_at ?? null],
		);
		reply.code(201);
		return rows[0];
	});

	app.get("/walks/:id/geojson", async (req, reply) => {
		const { id } = req.params as { id: string };
		const { rows } = await pool.query(
			`SELECT ST_AsGeoJSON(route) AS geojson FROM walks WHERE id = $1`,
			[id],
		);
		if (!rows[0]?.geojson) {
			reply.code(404);
			return { error: "No route available" };
		}
		return JSON.parse(rows[0].geojson);
	});
}
