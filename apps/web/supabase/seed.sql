-- Sample data for DineLink development and testing

-- Sample restaurants (Hong Kong focused)
INSERT INTO public.restaurants (name, name_chinese, address, cuisine_types, price_range, google_rating, features, photos, phone) VALUES 
('Tim Ho Wan', '添好運', 'Shop 8, Kwong Sang Hong Building, 6 Hennessy Road, Wan Chai', '{"dim_sum", "cantonese"}', 1, 4.2, '{"michelin_star", "affordable", "queue"}', '{"urls": ["https://example.com/tim-ho-wan-1.jpg"]}', '+852 2332 2896'),

('Kam Wah Cafe', '金華冰廳', '47 Bute Street, Prince Edward', '{"cha_chaan_teng", "hong_kong_style"}', 1, 4.1, '{"local_favorite", "breakfast", "pineapple_bun"}', '{"urls": ["https://example.com/kam-wah-1.jpg"]}', '+852 2392 6830'),

('Lung King Heen', '龍景軒', 'Four Seasons Hotel, 8 Finance Street, Central', '{"cantonese", "dim_sum"}', 4, 4.5, '{"michelin_three_star", "luxury", "private_rooms", "business_dining"}', '{"urls": ["https://example.com/lung-king-heen-1.jpg"]}', '+852 3196 8880'),

('Yung Kee Restaurant', '鏞記酒家', '32-40 Wellington Street, Central', '{"cantonese", "roast_goose"}', 3, 4.0, '{"famous_roast_goose", "traditional", "group_dining"}', '{"urls": ["https://example.com/yung-kee-1.jpg"]}', '+852 2522 1624'),

('Maxim Palace', '美心皇宮', 'Shop 2-8, 2/F, City Hall Low Block, Central', '{"dim_sum", "cantonese"}', 2, 3.9, '{"traditional_dim_sum", "trolley_service", "large_groups"}', '{"urls": ["https://example.com/maxim-palace-1.jpg"]}', '+852 2521 1303'),

('Tsui Wah Restaurant', '翠華餐廳', 'Multiple locations', '{"cha_chaan_teng", "hong_kong_style"}', 2, 3.8, '{"24_hours", "hong_kong_milk_tea", "casual_dining"}', '{"urls": ["https://example.com/tsui-wah-1.jpg"]}', '+852 2375 2582'),

('Din Tai Fung', '鼎泰豐', 'Shop 130, Level 1, Harbour City, Tsim Sha Tsui', '{"taiwanese", "xiaolongbao", "dim_sum"}', 3, 4.3, '{"famous_xiaolongbao", "clean", "consistent_quality"}', '{"urls": ["https://example.com/din-tai-fung-1.jpg"]}', '+852 2730 6928'),

('Mak An Kee Noodles', '麥安記麵家', '51 Parkes Street, Jordan', '{"noodles", "cantonese"}', 1, 4.0, '{"wonton_noodles", "local_institution", "affordable"}', '{"urls": ["https://example.com/mak-an-kee-1.jpg"]}', '+852 2384 9307');

-- Update restaurants with location data (Hong Kong coordinates) - convert to POINT
UPDATE public.restaurants SET location = POINT(114.1694, 22.2783) WHERE name = 'Tim Ho Wan'; -- Wan Chai
UPDATE public.restaurants SET location = POINT(114.1694, 22.3193) WHERE name = 'Kam Wah Cafe'; -- Prince Edward  
UPDATE public.restaurants SET location = POINT(114.1577, 22.2855) WHERE name = 'Lung King Heen'; -- Central
UPDATE public.restaurants SET location = POINT(114.1577, 22.2855) WHERE name = 'Yung Kee Restaurant'; -- Central
UPDATE public.restaurants SET location = POINT(114.1577, 22.2855) WHERE name = 'Maxim Palace'; -- Central
UPDATE public.restaurants SET location = POINT(114.1694, 22.2783) WHERE name = 'Tsui Wah Restaurant'; -- Multiple (using Wan Chai)
UPDATE public.restaurants SET location = POINT(114.1694, 22.2980) WHERE name = 'Din Tai Fung'; -- Tsim Sha Tsui
UPDATE public.restaurants SET location = POINT(114.1694, 22.3057) WHERE name = 'Mak An Kee Noodles'; -- Jordan

-- Sample opening hours (JSON format)
UPDATE public.restaurants SET opening_hours = '{"monday": {"open": "06:00", "close": "15:00"}, "tuesday": {"open": "06:00", "close": "15:00"}, "wednesday": {"open": "06:00", "close": "15:00"}, "thursday": {"open": "06:00", "close": "15:00"}, "friday": {"open": "06:00", "close": "15:00"}, "saturday": {"open": "06:00", "close": "15:00"}, "sunday": {"closed": true}}' WHERE name = 'Tim Ho Wan';

UPDATE public.restaurants SET opening_hours = '{"monday": {"open": "06:00", "close": "18:00"}, "tuesday": {"open": "06:00", "close": "18:00"}, "wednesday": {"open": "06:00", "close": "18:00"}, "thursday": {"open": "06:00", "close": "18:00"}, "friday": {"open": "06:00", "close": "18:00"}, "saturday": {"open": "06:00", "close": "18:00"}, "sunday": {"open": "06:00", "close": "18:00"}}' WHERE name = 'Kam Wah Cafe';

UPDATE public.restaurants SET opening_hours = '{"monday": {"open": "12:00", "close": "14:30", "dinner_open": "18:00", "dinner_close": "22:30"}, "tuesday": {"open": "12:00", "close": "14:30", "dinner_open": "18:00", "dinner_close": "22:30"}, "wednesday": {"open": "12:00", "close": "14:30", "dinner_open": "18:00", "dinner_close": "22:30"}, "thursday": {"open": "12:00", "close": "14:30", "dinner_open": "18:00", "dinner_close": "22:30"}, "friday": {"open": "12:00", "close": "14:30", "dinner_open": "18:00", "dinner_close": "22:30"}, "saturday": {"open": "12:00", "close": "14:30", "dinner_open": "18:00", "dinner_close": "22:30"}, "sunday": {"open": "11:30", "close": "15:00", "dinner_open": "18:00", "dinner_close": "22:30"}}' WHERE name = 'Lung King Heen';