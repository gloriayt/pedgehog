import { LogStressorEventInput } from "@pedgehog/shared";
import type { FastifyInstance } from "fastify";
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

	app.patch("/stressor-events/:id", async (req, reply) => {
		const { id } = req.params as { id: string };
		const { stressor_type_id, intensity, notes } = req.body as {
			stressor_type_id?: number;
			intensity?: number;
			notes?: string;
		};
		const { rowCount } = await pool.query(
			`UPDATE stressor_events SET
				stressor_type_id = COALESCE($2, stressor_type_id),
				intensity = COALESCE($3, intensity),
				notes = COALESCE($4, notes)
			WHERE id = $1`,
			[id, stressor_type_id ?? null, intensity ?? null, notes ?? null],
		);
		if (!rowCount) {
			reply.code(404);
			return { error: "Event not found" };
		}
		return { ok: true };
	});

	app.delete("/stressor-events/:id", async (req, reply) => {
		const { id } = req.params as { id: string };
		const { rowCount } = await pool.query(
			"DELETE FROM stressor_events WHERE id = $1",
			[id],
		);
		if (!rowCount) {
			reply.code(404);
			return { error: "Event not found" };
		}
		reply.code(204);
	});

	app.get("/stressor-events", async (req) => {
		const { dog_id, walk_id } = req.query as {
			dog_id?: string;
			walk_id?: string;
		};
		const conditions: string[] = [];
		const params: string[] = [];
		if (walk_id) {
			params.push(walk_id);
			conditions.push(`se.walk_id = $${params.length}`);
		}
		if (dog_id) {
			params.push(dog_id);
			conditions.push(`se.dog_id = $${params.length}`);
		}
		const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
		const { rows } = await pool.query(
			`SELECT se.*, st.label, st.category, st.direction, st.type,
				ST_Y(se.location::geometry) AS lat, ST_X(se.location::geometry) AS lng
			FROM stressor_events se
			JOIN stressor_types st ON st.id = se.stressor_type_id
			${where} ORDER BY se.occurred_at`,
			params,
		);
		return rows;
	});
}
