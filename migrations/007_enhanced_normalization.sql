-- migrations/007_enhanced_normalization.sql
-- Run this in your Supabase SQL Editor

-- Enhance the existing normalization trigger function
CREATE OR REPLACE FUNCTION set_report_normalization()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Normalize Business Name
    IF NEW.business_name IS NOT NULL THEN
        NEW.business_normalized := LOWER(TRIM(REGEXP_REPLACE(NEW.business_name, '[^a-zA-Z0-9]+', '', 'g')));
    END IF;

    -- 2. Normalize Phone Number
    IF NEW.phone_number IS NOT NULL THEN
        NEW.phone_normalized := REGEXP_REPLACE(NEW.phone_number, '[^0-9]+', '', 'g');
    END IF;

    -- 3. Update target_normalized (Priority: Phone > Business > Handle)
    NEW.target_normalized := COALESCE(
        NULLIF(NEW.phone_normalized, ''), 
        NULLIF(NEW.business_normalized, ''), 
        LOWER(TRIM(REGEXP_REPLACE(NEW.platform_handle, '[^a-zA-Z0-9]+', '', 'g')))
    );

    -- 4. Standardize Status (always lowercase)
    NEW.status := LOWER(TRIM(COALESCE(NEW.status, 'pending')));

    -- 5. Standardize Platform (PascalCase for consistency)
    IF NEW.platform IS NOT NULL THEN
        NEW.platform := INITCAP(TRIM(NEW.platform));
    END IF;

    -- 6. Standardize Incident Type (lowercase)
    IF NEW.incident_type IS NOT NULL THEN
        NEW.incident_type := LOWER(TRIM(NEW.incident_type));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
