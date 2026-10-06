INSERT INTO event_types (type, category, label, direction, weight, half_life_hours) VALUES
('cat_encounter', 'animal_interaction', 'Cat encounter', 1, 2.0, 12),
('dog_encounter', 'animal_interaction', 'Dog encounter', 1, 3.0, 24),
('bird_encounter', 'animal_interaction', 'Bird encounter', 1, 1.5, 12),
('zoomies', 'enrichment', 'Zoomies', -1, 1.5, 12),
('scavenge', 'log_only', 'Scavenge', 1, 1.0, 24),
('compliment', 'log_only', 'Compliment', -1, 1.0, 24)
ON CONFLICT (type) DO NOTHING;  