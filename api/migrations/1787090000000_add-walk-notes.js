export const shorthands = undefined;

export const up = (pgm) => {
	pgm.sql(`ALTER TABLE walks ADD COLUMN IF NOT EXISTS notes text;`);
};

export const down = (pgm) => {
	pgm.sql(`ALTER TABLE walks DROP COLUMN IF EXISTS notes;`);
};
