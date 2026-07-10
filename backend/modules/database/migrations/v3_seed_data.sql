-- Seed Default Users
INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role)
VALUES 
(1, 'System', 'Administrator', 'admin@devtech.com', '9999999999', '$2a$10$V0yU6BghcMeqgJb48/kPauoGZ04gqFz0zQG/t/4zP2dD/3wR2K3xG', 'admin'),
(2, 'Demo', 'Customer', 'customer@devtech.com', '9876543210', '$2a$10$V0yU6BghcMeqgJb48/kPauoGZ04gqFz0zQG/t/4zP2dD/3wR2K3xG', 'customer')
ON CONFLICT (id) DO NOTHING;

-- Seed Customer Address
INSERT INTO user_addresses (id, user_id, full_name, mobile, house_number, street, area, city, state, pincode, latitude, longitude, address_type, is_default)
VALUES 
(1, 2, 'Demo Customer', '9876543210', 'Flat 101', 'High Street', 'Downtown', 'Bengaluru', 'Karnataka', '560001', 12.97159870, 77.59456270, 'home', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Reset Sequences
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id)+1 FROM users), 1), false);
SELECT setval('user_addresses_id_seq', COALESCE((SELECT MAX(id)+1 FROM user_addresses), 1), false);
