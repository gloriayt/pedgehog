import type { FastifyInstance } from "fastify";
import { LogStressorEventInput } from "@pedgehog/shared";
import { pool } from "../db.js";

export default async function stressors(app: FastifyInstance) {
	app.get("/stressor-types", async () => {
		const { rows } = await pool.query(
			"SELECT * FROM stressor_types ORDER BY category, label",
		);
		return rows;
	});

	app.post("/stressor-events", async (req, reply) => {
		const parsed = LogStressorEventInput.safeParse(req.body);
		if (!parsed.success) {
			reply.code(400);
			return { error: parsed.error.flatten() };
		}
		const {
			dog_id,
			stressor_type_id,
			occurred_at,
			duration_minutes,
			intensity,
			walk_id,
			lat,
			lng,
			notes,
		} = parsed.data;

		const { rows } = await pool.query(
			`INSERT INTO stressor_events
				(dog_id, stressor_type_id, occurred_at, duration_minutes, intensity, walk_id, location, notes)
			VALUES ($1, $2, COALESCE($3, NOW()), $4, $5, $6,
				CASE WHEN $7::float IS NOT NULL AND $8::float IS NOT NULL
					THEN ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography
					ELSE NULL END,
				$9)
			RETURNING *`,
			[
				dog_id,
				stressor_type_id,
				occurred_at ?? null,
				duration_minutes ?? null,
				intensity ?? null,
				walk_id ?? null,
				lng ?? null,
				lat ?? null,
				notes ?? null,
			],
		);
		reply.code(201);
		return rows[0];
	});

	app.get("/stressor-events", async (req) => {
		const { dog_id } = req.query as { dog_id?: string };
		const { rows } = await pool.query(
			dog_id
				? "SELECT * FROM stressor_events WHERE dog_id = $1 ORDER BY occurred_at DESC"
				: "SELECT * FROM stressor_events ORDER BY occurred_at DESC",
			dog_id ? [dog_id] : [],
		);
		return rows;
	});
}
