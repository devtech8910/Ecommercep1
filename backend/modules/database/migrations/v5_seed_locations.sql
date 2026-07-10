-- v5_seed_locations.sql
-- Seed Mock Relational Location Data

INSERT INTO loc_countries (id, name, code, lat, lng) VALUES 
(1, 'India', 'IN', 20.5937, 78.9629)
ON CONFLICT DO NOTHING;

INSERT INTO loc_states (id, country_id, name, lat, lng) VALUES 
(1, 1, 'Andhra Pradesh', 15.9129, 79.7400),
(2, 1, 'Arunachal Pradesh', 28.2180, 94.7278),
(3, 1, 'Assam', 26.2006, 92.9376),
(4, 1, 'Bihar', 25.0961, 85.3131),
(5, 1, 'Chhattisgarh', 21.2787, 81.8661),
(6, 1, 'Goa', 15.2993, 74.1240),
(7, 1, 'Gujarat', 22.2587, 71.1924),
(8, 1, 'Haryana', 29.0588, 76.0856),
(9, 1, 'Himachal Pradesh', 31.1048, 77.1734),
(10, 1, 'Jharkhand', 23.6102, 85.2799),
(11, 1, 'Karnataka', 15.3173, 75.7139),
(12, 1, 'Kerala', 10.8505, 76.2711),
(13, 1, 'Madhya Pradesh', 22.9734, 78.6569),
(14, 1, 'Maharashtra', 19.7515, 75.7139),
(15, 1, 'Manipur', 24.6637, 93.9063),
(16, 1, 'Meghalaya', 25.4670, 91.3662),
(17, 1, 'Mizoram', 23.1645, 92.9376),
(18, 1, 'Nagaland', 26.1584, 94.5624),
(19, 1, 'Odisha', 20.9517, 85.0985),
(20, 1, 'Punjab', 31.1471, 75.3412),
(21, 1, 'Rajasthan', 27.0238, 74.2179),
(22, 1, 'Sikkim', 27.5330, 88.5122),
(23, 1, 'Tamil Nadu', 11.1271, 78.6569),
(24, 1, 'Telangana', 18.1124, 79.0193),
(25, 1, 'Tripura', 23.9408, 91.9882),
(26, 1, 'Uttar Pradesh', 26.8467, 80.9462),
(27, 1, 'Uttarakhand', 30.0668, 79.0193),
(28, 1, 'West Bengal', 22.9868, 87.8550),
(29, 1, 'Andaman and Nicobar Islands', 11.7401, 92.6586),
(30, 1, 'Chandigarh', 30.7333, 76.7794),
(31, 1, 'Dadra and Nagar Haveli and Daman and Diu', 20.1809, 73.0169),
(32, 1, 'Delhi', 28.7041, 77.1025),
(33, 1, 'Jammu and Kashmir', 33.7782, 76.5762),
(34, 1, 'Ladakh', 34.1526, 77.5771),
(35, 1, 'Lakshadweep', 10.5667, 72.6167),
(36, 1, 'Puducherry', 11.9416, 79.8083)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO loc_cities (id, state_id, name, lat, lng) VALUES 
-- Andhra Pradesh (1)
(1, 1, 'Anakapalli', 17.6896, 83.0024),
(2, 1, 'Anantapur', 14.6819, 77.6006),
(3, 1, 'Annamayya', 13.9784, 78.9629),
(4, 1, 'Bapatla', 15.9045, 80.4682),
(5, 1, 'Chittoor', 13.2172, 79.1003),
(6, 1, 'East Godavari', 16.9891, 82.2475),
(7, 1, 'Eluru', 16.7104, 81.1026),
(8, 1, 'Guntur', 16.3067, 80.4365),
(9, 1, 'Kakinada', 16.9891, 82.2475),
(10, 1, 'Konaseema', 16.5937, 82.0024),
(11, 1, 'Krishna', 16.1667, 81.1333),
(12, 1, 'Kurnool', 15.8281, 78.0373),
(13, 1, 'Nandyal', 15.4810, 78.4870),
(14, 1, 'NTR', 16.5062, 80.6480),
(15, 1, 'Palnadu', 16.2937, 79.9024),
(16, 1, 'Parvathipuram Manyam', 18.7770, 83.4285),
(17, 1, 'Prakasam', 15.5024, 79.9924),
(18, 1, 'Sri Potti Sriramulu Nellore', 14.4426, 79.9865),
(19, 1, 'Srikakulam', 18.2949, 83.8938),
(20, 1, 'Sri Sathya Sai', 14.1667, 77.8000),
(21, 1, 'Tirupati', 13.6288, 79.4192),
(22, 1, 'Visakhapatnam', 17.6868, 83.2185),
(23, 1, 'Vizianagaram', 18.1124, 83.3989),
(24, 1, 'West Godavari', 16.7104, 81.6026),
(25, 1, 'YSR Kadapa', 14.4673, 78.8242),

-- Karnataka (11)
(26, 11, 'Bagalkot', 16.1813, 75.6958),
(27, 11, 'Ballari', 15.1394, 76.9214),
(28, 11, 'Belagavi', 15.8497, 74.4977),
(29, 11, 'Bengaluru Rural', 13.2137, 77.7279),
(30, 11, 'Bengaluru Urban', 12.9716, 77.5946),
(31, 11, 'Bidar', 17.9104, 77.5199),
(32, 11, 'Chamarajanagar', 11.9261, 76.9437),
(33, 11, 'Chikkaballapur', 13.4354, 77.7277),
(34, 11, 'Chikkamagaluru', 13.3161, 75.7720),
(35, 11, 'Chitradurga', 14.2251, 76.3980),
(36, 11, 'Dakshina Kannada', 12.8703, 74.8826),
(37, 11, 'Davanagere', 14.4644, 75.9218),
(38, 11, 'Dharwad', 15.4589, 75.0078),
(39, 11, 'Gadag', 15.4278, 75.6361),
(40, 11, 'Hassan', 13.0072, 76.1026),
(41, 11, 'Haveri', 14.7958, 75.4022),
(42, 11, 'Kalaburagi', 17.3294, 76.8341),
(43, 11, 'Kodagu', 12.4244, 75.7389),
(44, 11, 'Kolar', 13.1368, 78.1292),
(45, 11, 'Koppal', 15.3467, 76.1551),
(46, 11, 'Mandya', 12.5218, 76.8951),
(47, 11, 'Mysuru', 12.2958, 76.6394),
(48, 11, 'Raichur', 16.2076, 77.3582),
(49, 11, 'Ramanagara', 12.7156, 77.2813),
(50, 11, 'Shivamogga', 13.9299, 75.5681),
(51, 11, 'Tumakuru', 13.3379, 77.1173),
(52, 11, 'Udupi', 13.3409, 74.7421),
(53, 11, 'Uttara Kannada', 14.8080, 74.5828),
(54, 11, 'Vijayapura', 16.8302, 75.7100),
(55, 11, 'Vijayanagara', 15.2251, 76.3980),
(56, 11, 'Yadgir', 16.7600, 77.1378),

-- Tamil Nadu (23)
(57, 23, 'Ariyalur', 11.1401, 79.0786),
(58, 23, 'Chengalpattu', 12.6841, 79.9836),
(59, 23, 'Chennai', 13.0827, 80.2707),
(60, 23, 'Coimbatore', 11.0168, 76.9558),
(61, 23, 'Cuddalore', 11.7480, 79.7714),
(62, 23, 'Dharmapuri', 12.1356, 78.1578),
(63, 23, 'Dindigul', 10.3673, 77.9803),
(64, 23, 'Erode', 11.3410, 77.7172),
(65, 23, 'Kallakurichi', 11.7370, 78.9625),
(66, 23, 'Kancheepuram', 12.8387, 79.7016),
(67, 23, 'Kanniyakumari', 8.0883, 77.5385),
(68, 23, 'Karur', 10.9601, 78.0766),
(69, 23, 'Krishnagiri', 12.5266, 78.2148),
(70, 23, 'Madurai', 9.9252, 78.1198),
(71, 23, 'Mayiladuthurai', 11.1018, 79.6522),
(72, 23, 'Nagapattinam', 10.7656, 79.8424),
(73, 23, 'Namakkal', 11.2189, 78.1672),
(74, 23, 'Nilgiris', 11.4167, 76.7000),
(75, 23, 'Perambalur', 11.2342, 78.8820),
(76, 23, 'Pudukkottai', 10.3833, 78.8167),
(77, 23, 'Ramanathapuram', 9.3676, 78.8340),
(78, 23, 'Ranipet', 12.9272, 79.3326),
(79, 23, 'Salem', 11.6643, 78.1460),
(80, 23, 'Sivaganga', 9.8433, 78.4833),
(81, 23, 'Tenkasi', 8.9593, 77.3150),
(82, 23, 'Thanjavur', 10.7870, 79.1378),
(83, 23, 'Theni', 10.0104, 77.4768),
(84, 23, 'Thoothukudi', 8.7642, 78.1348),
(85, 23, 'Tiruchirappalli', 10.7905, 78.7047),
(86, 23, 'Tirunelveli', 8.7139, 77.7567),
(87, 23, 'Tirupathur', 12.4934, 78.5678),
(88, 23, 'Tiruppur', 11.1085, 77.3411),
(89, 23, 'Tiruvallur', 13.1438, 79.9079),
(90, 23, 'Tiruvannamalai', 12.2272, 79.0700),
(91, 23, 'Tiruvarur', 10.7725, 79.6361),
(92, 23, 'Vellore', 12.9165, 79.1325),
(93, 23, 'Viluppuram', 11.9401, 79.4861),
(94, 23, 'Virudhunagar', 9.5872, 77.9514),

-- Other major states default districts so they are not empty
-- Maharashtra (14)
(95, 14, 'Mumbai', 19.0760, 72.8777),
(96, 14, 'Pune', 18.5204, 73.8567),
(97, 14, 'Nagpur', 21.1458, 79.0882),
(98, 14, 'Thane', 19.2183, 72.9781),

-- Delhi (32)
(99, 32, 'New Delhi', 28.6139, 77.2090),
(100, 32, 'North Delhi', 28.7041, 77.1025),
(101, 32, 'South Delhi', 28.5355, 77.2410),

-- Kerala (12)
(102, 12, 'Thiruvananthapuram', 8.5241, 76.9366),
(103, 12, 'Kochi', 9.9312, 76.2673),
(104, 12, 'Kozhikode', 11.2588, 75.7804),

-- Telangana (24)
(105, 24, 'Hyderabad', 17.3850, 78.4867),
(106, 24, 'Warangal', 17.9689, 79.5941),

-- Uttar Pradesh (26)
(107, 26, 'Lucknow', 26.8467, 80.9462),
(108, 26, 'Noida', 28.5355, 77.3910),
(109, 26, 'Kanpur', 26.4499, 80.3319),

-- West Bengal (28)
(110, 28, 'Kolkata', 22.5726, 88.3639),
(111, 28, 'Howrah', 22.5958, 88.2636),

-- Gujarat (7)
(112, 7, 'Ahmedabad', 23.0225, 72.5714),
(113, 7, 'Surat', 21.1702, 72.8311),

-- Seed defaults for ALL other states so they have at least 1 district populated in the dropdown!
(114, 2, 'Itanagar', 27.0844, 93.6053),
(115, 3, 'Dispur', 26.1433, 91.7898),
(116, 4, 'Patna', 25.5941, 85.1376),
(117, 5, 'Raipur', 21.2514, 81.6296),
(118, 6, 'Panaji', 15.4909, 73.8278),
(119, 8, 'Gurugram', 28.4595, 77.0266),
(120, 9, 'Shimla', 31.1048, 77.1734),
(121, 10, 'Ranchi', 23.3441, 85.3096),
(122, 13, 'Bhopal', 23.2599, 77.4126),
(123, 15, 'Imphal', 24.8170, 93.9368),
(124, 16, 'Shillong', 25.5788, 91.8831),
(125, 17, 'Aizawl', 23.7307, 92.7173),
(126, 18, 'Kohima', 25.6751, 94.1086),
(127, 19, 'Bhubaneswar', 20.2961, 85.8245),
(128, 20, 'Ludhiana', 30.9010, 75.8573),
(129, 21, 'Jaipur', 26.9124, 75.7873),
(130, 22, 'Gangtok', 27.3314, 88.6138),
(131, 25, 'Agartala', 23.8315, 91.2868),
(132, 27, 'Dehradun', 30.3165, 78.0322),
(133, 30, 'Chandigarh District', 30.7333, 76.7794),
(134, 31, 'Daman', 20.4143, 72.8324),
(135, 33, 'Srinagar', 34.0837, 74.7973),
(136, 34, 'Leh', 34.1526, 77.5771),
(137, 35, 'Kavaratti', 10.5667, 72.6167),
(138, 36, 'Puducherry District', 11.9416, 79.8083)
ON CONFLICT (id) DO UPDATE SET state_id = EXCLUDED.state_id, name = EXCLUDED.name;

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
