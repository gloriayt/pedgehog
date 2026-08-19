import "dotenv/config";
import { pool } from "./db.js";
import { endStaleWalks, fillMissingSuburbs } from "./walkHelpers.js";

async function cleanup() {
	const ended = await endStaleWalks();
	console.log(`Ended ${ended.length} stale walk(s)`);

	const filled = await fillMissingSuburbs();
	console.log(`Filled ${filled} missing suburb(s)`);

	await pool.end();
	console.log("Done");
}

cleanup();
