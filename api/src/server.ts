import Fastify from 'fastify';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

app.get('/dog_profiles', async () => {
  const { rows } = await pool.query('SELECT * FROM dog_profiles ORDER BY id');
  return rows;
});

app.post('/dog_profiles', async (req, reply) => {
  const { name, breed } = req.body as { name: string; breed?: string };
  const { rows } = await pool.query(
    'INSERT INTO dog_profiles (name, breed) VALUES ($1, $2) RETURNING *',
    [name, breed]
  );
  reply.code(201);
  return rows[0];
});

app.listen({ port: 3000, host: '0.0.0.0' })
  .then(() => console.log('Running on :3000'));
