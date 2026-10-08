-- Dummy users and addresses were removed.
-- Real admin/customer accounts must be created through the configured auth flow.

-- Reset Sequences
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id)+1 FROM users), 1), false);
SELECT setval('user_addresses_id_seq', COALESCE((SELECT MAX(id)+1 FROM user_addresses), 1), false);
