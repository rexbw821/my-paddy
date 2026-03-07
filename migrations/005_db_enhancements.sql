-- migrations/005_db_enhancements.sql
-- Run this in your Supabase SQL Editor to automate normalization and aggregation

-- 1. Automatic Normalization Trigger Function
CREATE OR REPLACE FUNCTION set_report_normalization()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize Business Name
    IF NEW.business_name IS NOT NULL THEN
        NEW.business_normalized := LOWER(TRIM(REGEXP_REPLACE(NEW.business_name, '[^a-zA-Z0-9]+', '', 'g')));
    END IF;

    -- Normalize Phone Number
    IF NEW.phone_number IS NOT NULL THEN
        NEW.phone_normalized := REGEXP_REPLACE(NEW.phone_number, '[^0-9]+', '', 'g');
    END IF;

    -- Update target_normalized (Priority: Phone > Business > Handle)
    NEW.target_normalized := COALESCE(
        NEW.phone_normalized, 
        NEW.business_normalized, 
        LOWER(TRIM(REGEXP_REPLACE(NEW.platform_handle, '[^a-zA-Z0-9]+', '', 'g')))
    );

    -- Standardize Status to lowercase
    NEW.status := LOWER(TRIM(NEW.status));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger to the reports table
DROP TRIGGER IF EXISTS trigger_normalize_report ON reports;
CREATE TRIGGER trigger_normalize_report
BEFORE INSERT OR UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION set_report_normalization();

-- 3. Aggregate Summary View
CREATE OR REPLACE VIEW report_summaries AS
SELECT 
    target_normalized,
    platform,
    COUNT(*) as total_reports,
    MAX(created_at) as last_reported_at,
    CASE 
        WHEN COUNT(*) = 0 THEN 'LOW'
        WHEN COUNT(*) <= 2 THEN 'MEDIUM'
        ELSE 'HIGH'
    END as risk_level
FROM reports
WHERE status = 'approved'
GROUP BY target_normalized, platform;
