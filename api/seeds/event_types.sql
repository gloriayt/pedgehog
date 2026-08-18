INSERT INTO event_types (type, category, label, direction, weight, half_life_hours) VALUES
('cat_encounter', 'animal_interaction', 'Cat encounter', 1, 2.0, 12),
('dog_encounter', 'animal_interaction', 'Dog encounter', 1, 3.0, 24),
('home_alone', 'routine', 'Left home alone', 1, 2.5, 24),
('human_encounter', 'human_interaction', 'Nervous human encounter', 1, 0.5, 1),
('nail_trim', 'routine', 'Nail trim', 1, 0.5, 0.5),

('sniffy_walk', 'enrichment', 'Sniffy walk', -1, 2.0, 12),
('zoomies', 'enrichment', 'Zoomies', -1, 1.5, 12),
('bone_chew', 'enrichment', 'Bone chew', -1, 1.0, 0.5),
('food_puzzle', 'enrichment', 'Food puzzle', -1, 1.0, 0.5),
('human_encounter', 'human_interaction', 'Happy human encounter', -1, 0.5, 1),

('bird_encounter', 'animal_interaction', 'Bird encounter', 1, 1.5, 12),
('scavenge', 'log_only', 'Scavenge', 1, 1.0, 24),
('compliment', 'log_only', 'Compliment', -1, 1.0, 24)
ON CONFLICT (type) DO NOTHING;  