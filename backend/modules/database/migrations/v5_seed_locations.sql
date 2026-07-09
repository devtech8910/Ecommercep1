-- v5_seed_locations.sql
-- Seed Mock Relational Location Data

INSERT INTO loc_countries (id, name, code, lat, lng) VALUES 
(1, 'India', 'IN', 20.5937, 78.9629)
ON CONFLICT DO NOTHING;

INSERT INTO loc_states (id, country_id, name, lat, lng) VALUES 
(1, 1, 'Karnataka', 15.3173, 75.7139),
(2, 1, 'Maharashtra', 19.7515, 75.7139),
(3, 1, 'Delhi', 28.7041, 77.1025)
ON CONFLICT DO NOTHING;

INSERT INTO loc_cities (id, state_id, name, lat, lng) VALUES 
(1, 1, 'Bengaluru', 12.9716, 77.5946),
(2, 1, 'Mysuru', 12.2958, 76.6394),
(3, 2, 'Mumbai', 19.0760, 72.8777),
(4, 2, 'Pune', 18.5204, 73.8567)
ON CONFLICT DO NOTHING;

INSERT INTO loc_areas (id, city_id, name, pincode, lat, lng) VALUES 
(1, 1, 'Indiranagar', '560038', 12.9784, 77.6408),
(2, 1, 'Koramangala', '560034', 12.9352, 77.6245),
(3, 1, 'Whitefield', '560066', 12.9698, 77.7499),
(4, 3, 'Bandra West', '400050', 19.0596, 72.8295),
(5, 3, 'Andheri East', '400069', 19.1136, 72.8697)
ON CONFLICT DO NOTHING;

INSERT INTO loc_streets (id, area_id, name, lat, lng) VALUES 
(1, 1, '100 Feet Road', 12.9784, 77.6408),
(2, 1, 'CMH Road', 12.9719, 77.6412),
(3, 2, '80 Feet Road', 12.9352, 77.6245),
(4, 2, 'Jyoti Nivas College Road', 12.9350, 77.6180),
(5, 4, 'Carter Road', 19.0632, 72.8236),
(6, 4, 'Hill Road', 19.0558, 72.8335)
ON CONFLICT DO NOTHING;

-- Reset sequences
SELECT setval('loc_countries_id_seq', (SELECT MAX(id) FROM loc_countries));
SELECT setval('loc_states_id_seq', (SELECT MAX(id) FROM loc_states));
SELECT setval('loc_cities_id_seq', (SELECT MAX(id) FROM loc_cities));
SELECT setval('loc_areas_id_seq', (SELECT MAX(id) FROM loc_areas));
SELECT setval('loc_streets_id_seq', (SELECT MAX(id) FROM loc_streets));
