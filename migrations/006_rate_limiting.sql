-- migrations/006_rate_limiting.sql
-- Run this in your Supabase SQL Editor

-- Function to prevent duplicate reports within a short timeframe
CREATE OR REPLACE FUNCTION prevent_duplicate_reports()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a report with the same target and platform exists from the same "source" 
    -- in the last 10 minutes.
    -- (Note: In a web app, 'source' would ideally be a user ID or IP. 
    -- Since we're keeping it simple, we'll check for identical targets/platforms.)
    
    IF EXISTS (
        SELECT 1 FROM reports 
        WHERE target_normalized = NEW.target_normalized 
        AND platform = NEW.platform
        AND created_at > (NOW() - INTERVAL '10 minutes')
    ) THEN
        RAISE EXCEPTION 'Duplicate report detected. Please wait 10 minutes before reporting this target again.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the rate limiting trigger
DROP TRIGGER IF EXISTS trigger_rate_limit_report ON reports;
CREATE TRIGGER trigger_rate_limit_report
BEFORE INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_reports();
