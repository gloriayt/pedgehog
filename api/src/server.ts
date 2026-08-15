import cors from "@fastify/cors";
import Fastify from "fastify";
import "dotenv/config";
import dogs from "./routes/dogs.js";
import stressors from "./routes/stressors.js";
import walks from "./routes/walks.js";

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
app.register(stressors);

app
	.listen({ port: 3000, host: "0.0.0.0" })
	.then(() => console.log("Running on :3000"));
