-- v4_location_hierarchy.sql
-- Normalized Hierarchical Location Database

CREATE TABLE IF NOT EXISTS loc_countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10),
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL
);

CREATE TABLE IF NOT EXISTS loc_states (
    id SERIAL PRIMARY KEY,
    country_id INTEGER NOT NULL REFERENCES loc_countries(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    UNIQUE(country_id, name)
);

CREATE TABLE IF NOT EXISTS loc_cities (
    id SERIAL PRIMARY KEY,
    state_id INTEGER NOT NULL REFERENCES loc_states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    UNIQUE(state_id, name)
);

CREATE TABLE IF NOT EXISTS loc_areas (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES loc_cities(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    pincode VARCHAR(20),
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    UNIQUE(city_id, name)
);

CREATE TABLE IF NOT EXISTS loc_streets (
    id SERIAL PRIMARY KEY,
    area_id INTEGER NOT NULL REFERENCES loc_areas(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    UNIQUE(area_id, name)
);

-- Indexes for fast autocomplete queries
CREATE INDEX IF NOT EXISTS idx_loc_states_name ON loc_states (name varchar_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_loc_cities_name ON loc_cities (name varchar_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_loc_areas_name ON loc_areas (name varchar_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_loc_streets_name ON loc_streets (name varchar_pattern_ops);
