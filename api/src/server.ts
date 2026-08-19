import cors from "@fastify/cors";
import Fastify from "fastify";
import "dotenv/config";
import dogs from "./routes/dogs.js";
import events from "./routes/events.js";
import walks from "./routes/walks.js";
import { endStaleWalks, fillMissingSuburbs } from "./walkHelpers.js";

const app = Fastify({ logger: true });

await app.register(cors, {
	origin: [
		/^http:\/\/localhost:\d+$/,
		"https://pedgehog.com",
		"https://www.pedgehog.com",
	],
	methods: ["GET", "POST", "PATCH", "DELETE"],
});

app.get("/health", async () => ({ status: "ok" }));

app.register(dogs);
app.register(walks);
app.register(events);

app
	.listen({ port: 3000, host: "0.0.0.0" })
	.then(() => console.log("Running on :3000"));

// Cleanup stale walks every 2 hours
setInterval(async () => {
	try {
		await endStaleWalks();
		await fillMissingSuburbs();
	} catch (e) {
		console.error("Cleanup failed:", e);
	}
}, 2 * 60 * 60 * 1000);
