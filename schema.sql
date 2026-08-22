-- ============================================================
-- FASHIONCOMPANY FASHION — POSTGRESQL DATABASE SCHEMA
-- Relational tables supporting multi-address delivery and order logs
-- ============================================================

-- Drop tables if they exist
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    date_of_birth DATE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    phn_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create User Addresses Table (Allows multiple addresses per user)
CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    house_number VARCHAR(100) NOT NULL,
    building VARCHAR(150),
    street VARCHAR(150) NOT NULL,
    area VARCHAR(150) NOT NULL,
    landmark VARCHAR(150),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,

    address_type VARCHAR(20) DEFAULT 'home', -- 'home' or 'work'
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 3. Create Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- 4. Create Products Table
CREATE TABLE products (
    pid SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(255),
    sizes VARCHAR(10)[], -- Array of sizes (e.g. S, M, L, XL)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    address_id INT REFERENCES user_addresses(id) ON DELETE SET NULL, -- Links specific address used
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(pid) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- 7. Create Wishlist Table
CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(pid) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- ============================================================
-- INITIAL SEED DATA
-- ============================================================

-- Seed Categories
INSERT INTO categories (name, slug, description) VALUES
('Men''s Wear', 'men', 'Tailored suits, premium casuals, and luxury essentials.'),
('Women''s Wear', 'women', 'Timeless grace, modern edits, and high-end dresses.'),
('Kids'' Wear', 'kids', 'Playful designer styles and comfortable premium clothes.');

-- Seed Mock Products (matching Home page layouts)
INSERT INTO products (category_id, title, description, price, stock_quantity, image_url, sizes) VALUES
(1, 'Premium Tailored Navy Suit', 'Hand-cut slim-fit luxury suit crafted from 100% fine wool.', 18999.00, 15, 'https://images.unsplash.com/photo-1617137968427-85924c800a22', ARRAY['M', 'L', 'XL']),
(2, 'Editorial Cashmere Trench Coat', 'Classic beige trench coat in double-sided recycled cashmere.', 24500.00, 8, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105', ARRAY['S', 'M', 'L']),
(3, 'Kids Playful Striped Set', 'Comfortable organic cotton tee and shorts set for everyday play.', 3200.00, 30, 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4', ARRAY['S', 'M']);

-- 8. Create Addresses Table (for Google Maps address picker)
DROP TABLE IF EXISTS addresses CASCADE;
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    area VARCHAR(150) NOT NULL,
    street VARCHAR(150) NOT NULL,
    flat VARCHAR(150) NOT NULL,
    landmark VARCHAR(150),
    formatted_address TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    place_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
