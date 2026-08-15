import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";

export default async function dogs(app: FastifyInstance) {
	app.get("/dog_profiles", async () => {
		const { rows } = await pool.query(
			"SELECT * FROM dog_profiles ORDER BY id",
		);
		return rows;
	});

	app.post("/dog_profiles", async (req, reply) => {
		const { name, breed } = req.body as { name: string; breed?: string };
		const { rows } = await pool.query(
			"INSERT INTO dog_profiles (name, breed) VALUES ($1, $2) RETURNING *",
			[name, breed],
		);
		reply.code(201);
		return rows[0];
	});
}
