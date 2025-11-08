-- This script updates the location of existing shops to random coordinates within Addis Ababa.
-- It's designed to be idempotent, meaning it can be run multiple times without changing the result after the first run.

DO $$
DECLARE
    -- Define the bounding box for Addis Ababa
    min_lat REAL := 8.84;
    max_lat REAL := 9.05;
    min_lon REAL := 38.65;
    max_lon REAL := 38.85;
BEGIN
    -- Update the location for all shops that are not hubs
    UPDATE public.shops
    SET location = ST_SetSRID(ST_MakePoint(
        min_lon + (max_lon - min_lon) * random(),
        min_lat + (max_lat - min_lat) * random()
    ), 4326)::point
    WHERE is_hub = FALSE;
END $$;