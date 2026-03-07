-- migrations/002_search_reports_rpc.sql
-- Run this in your Supabase SQL Editor to update the function

CREATE OR REPLACE FUNCTION search_reports(search_term TEXT, platform_filter TEXT DEFAULT NULL)
RETURNS SETOF reports AS $$
DECLARE
    normalized_term TEXT;
BEGIN
    -- Normalize the search term (same as JS logic)
    normalized_term := LOWER(TRIM(search_term));
    
    -- If search term is too short or empty, return nothing
    IF normalized_term IS NULL OR LENGTH(normalized_term) < 2 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT *
    FROM reports
    WHERE LOWER(status) = 'approved'
    AND (
        (business_normalized ILIKE '%' || normalized_term || '%') OR
        (phone_normalized ILIKE '%' || normalized_term || '%') OR
        (target_normalized ILIKE '%' || normalized_term || '%') OR
        (platform_handle ILIKE '%' || normalized_term || '%')
    )
    AND (
        platform_filter IS NULL OR 
        platform_filter = '' OR 
        LOWER(platform) = LOWER(platform_filter)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
