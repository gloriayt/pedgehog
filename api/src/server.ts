import Fastify from 'fastify';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

// ------ dog profiles
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

// ------ walks
app.post('/walks', async (req, reply) => {
  const { dog_id } = req.body as { dog_id: number };
  const { rows } = await pool.query(
    'INSERT INTO walks (dog_id, started_at) VALUES ($1, NOW()) RETURNING *',
    [dog_id]
  );
  reply.code(201);
  return rows[0];
});

app.get('/walks', async (req) => {
  const { dog_id } = req.query as { dog_id?: string };
  const { rows } = await pool.query(
    dog_id
      ? 'SELECT * FROM walks WHERE dog_id = $1 ORDER BY started_at DESC'
      : 'SELECT * FROM walks ORDER BY started_at DESC',
    dog_id ? [dog_id] : []
  );
  return rows;
});

app.get('/walks/:id', async (req) => {
  const { id } = req.params as { id: string };
  const { rows } = await pool.query('SELECT * FROM walks WHERE id = $1', [id]);
  return rows[0];
});

app.patch('/walks/:id', async (req) => {
  const { id } = req.params as { id: string };
  const { stress_score } = req.body as { stress_score?: number };

  await pool.query('UPDATE walks SET ended_at = NOW(), stress_score = $2 WHERE id = $1', [id, stress_score ?? null]);

  const { rows: pointCount } = await pool.query(
    'SELECT COUNT(*) FROM walk_points WHERE walk_id = $1', [id]
  );

  if (Number(pointCount[0].count) >= 2) {
    await pool.query(`
      UPDATE walks
      SET route = ST_Simplify(
        (SELECT ST_MakeLine(location::geometry ORDER BY recorded_at) FROM walk_points WHERE walk_id = $1),
        0.00005
      )::geography
      WHERE id = $1
    `, [id]);

    await pool.query(`UPDATE walks SET distance = ST_Length(route) WHERE id = $1`, [id]);
  }

  const { rows } = await pool.query('SELECT * FROM walks WHERE id = $1', [id]);
  return rows[0];
});

app.post('/walks/:id/points', async (req, reply) => {
  const { id } = req.params as { id: string };
  const { lat, lng, recorded_at } = req.body as { lat: number; lng: number; recorded_at?: string };

  const { rows } = await pool.query(
    `INSERT INTO walk_points (walk_id, location, recorded_at)
     VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, COALESCE($4, NOW()))
     RETURNING *`,
    [id, lng, lat, recorded_at ?? null]
  );
  reply.code(201);
  return rows[0];
});

// ------ stressor types
app.get('/stressor-types', async () => {
  const { rows } = await pool.query('SELECT * FROM stressor_types ORDER BY category, label');
  return rows;
});

// ------ stressor events
app.post('/stressor-events', async (req, reply) => {
  const {
    dog_id, stressor_type_id, occurred_at, duration_minutes,
    intensity, walk_id, lat, lng, notes
  } = req.body as {
    dog_id: number; stressor_type_id: number; occurred_at?: string;
    duration_minutes?: number; intensity?: number; walk_id?: number;
    lat?: number; lng?: number; notes?: string;
  };

  const { rows } = await pool.query(
    `INSERT INTO stressor_events
      (dog_id, stressor_type_id, occurred_at, duration_minutes, intensity, walk_id, location, notes)
     VALUES ($1, $2, COALESCE($3, NOW()), $4, $5, $6,
       CASE WHEN $7::float IS NOT NULL AND $8::float IS NOT NULL
         THEN ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography
         ELSE NULL END,
       $9)
     RETURNING *`,
    [dog_id, stressor_type_id, occurred_at ?? null, duration_minutes ?? null,
     intensity ?? null, walk_id ?? null, lng ?? null, lat ?? null, notes ?? null]
  );
  reply.code(201);
  return rows[0];
});

app.get('/stressor-events', async (req) => {
  const { dog_id } = req.query as { dog_id?: string };
  const { rows } = await pool.query(
    dog_id
      ? 'SELECT * FROM stressor_events WHERE dog_id = $1 ORDER BY occurred_at DESC'
      : 'SELECT * FROM stressor_events ORDER BY occurred_at DESC',
    dog_id ? [dog_id] : []
  );
  return rows;
});

app.listen({ port: 3000, host: '0.0.0.0' })
  .then(() => console.log('Running on :3000'));
