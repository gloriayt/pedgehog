/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createExtension('postgis', { ifNotExists: true });

  pgm.sql(`
    CREATE TABLE dog_profiles (
      id serial PRIMARY KEY,
      name text NOT NULL,
      breed text,
      created_at timestamptz NOT NULL DEFAULT NOW()
    );

    CREATE TABLE walks (
      id serial PRIMARY KEY,
      dog_id int NOT NULL REFERENCES dog_profiles(id),
      started_at timestamptz NOT NULL,
      ended_at timestamptz,
      route geography(LineString,4326),
      distance real,
      stress_score smallint CHECK (stress_score BETWEEN 1 AND 5),
      created_at timestamptz NOT NULL DEFAULT NOW()
    );

    CREATE TABLE walk_points (
      id bigserial PRIMARY KEY,
      walk_id int NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
      location geography(Point,4326) NOT NULL,
      recorded_at timestamptz NOT NULL
    );

    CREATE INDEX walk_points_walk_id_idx ON walk_points (walk_id);
    CREATE INDEX walk_points_location_idx ON walk_points USING GIST (location);

    CREATE TABLE stressor_types (
      id serial PRIMARY KEY,
      type text UNIQUE NOT NULL,
      category text NOT NULL CHECK (category IN ('routine','animal_interaction','human_interaction','enrichment')),
      label text NOT NULL,
      direction smallint NOT NULL CHECK (direction IN (-1, 1)),
      weight real NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 5),
      half_life_hours real NOT NULL CHECK (half_life_hours > 0),
      created_at timestamptz NOT NULL DEFAULT NOW()
    );

    CREATE TABLE stressor_events (
      id bigserial PRIMARY KEY,
      dog_id int NOT NULL REFERENCES dog_profiles(id),
      stressor_type_id int NOT NULL REFERENCES stressor_types(id),
      occurred_at timestamptz NOT NULL,
      duration_minutes int CHECK (duration_minutes >= 0),
      intensity smallint CHECK (intensity BETWEEN 1 AND 5),
      walk_id int REFERENCES walks(id),
      location geography(Point,4326),
      notes text,
      created_at timestamptz NOT NULL DEFAULT NOW()
    );

    CREATE INDEX stressor_events_location_idx ON stressor_events USING GIST (location);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE stressor_events;
    DROP TABLE stressor_types;
    DROP TABLE walks;
    DROP TABLE dog_profiles;
  `);
};