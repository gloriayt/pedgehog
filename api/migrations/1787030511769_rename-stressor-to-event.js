/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
	pgm.sql(`ALTER TABLE stressor_types RENAME TO event_types;`);
	pgm.sql(`ALTER TABLE stressor_events RENAME TO events;`);
	pgm.sql(`ALTER TABLE events RENAME COLUMN stressor_type_id TO event_type_id;`);
	pgm.sql(`ALTER INDEX IF EXISTS stressor_events_pkey RENAME TO events_pkey;`);
	pgm.sql(`ALTER INDEX IF EXISTS stressor_types_pkey RENAME TO event_types_pkey;`);

	// Rename constraints
	pgm.sql(`ALTER TABLE event_types DROP CONSTRAINT IF EXISTS stressor_types_category_check;`);
	pgm.sql(`ALTER TABLE event_types ADD CONSTRAINT event_types_category_check CHECK (category IN ('routine', 'animal_interaction', 'human_interaction', 'enrichment', 'log_only'));`);
	pgm.sql(`ALTER TABLE event_types RENAME CONSTRAINT stressor_types_direction_check TO event_types_direction_check;`);
	pgm.sql(`ALTER TABLE event_types RENAME CONSTRAINT stressor_types_weight_check TO event_types_weight_check;`);
	pgm.sql(`ALTER TABLE event_types RENAME CONSTRAINT stressor_types_half_life_hours_check TO event_types_half_life_hours_check;`);

	// Update events constraints
	pgm.sql(`ALTER TABLE events DROP CONSTRAINT IF EXISTS stressor_events_intensity_check;`);
	pgm.sql(`ALTER TABLE events ADD CONSTRAINT events_intensity_check CHECK (intensity >= 0 AND intensity <= 5);`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
	pgm.sql(`ALTER TABLE events RENAME COLUMN event_type_id TO stressor_type_id;`);
	pgm.sql(`ALTER TABLE events RENAME TO stressor_events;`);
	pgm.sql(`ALTER TABLE event_types RENAME TO stressor_types;`);
	pgm.sql(`ALTER INDEX IF EXISTS events_pkey RENAME TO stressor_events_pkey;`);
	pgm.sql(`ALTER INDEX IF EXISTS event_types_pkey RENAME TO stressor_types_pkey;`);
};
