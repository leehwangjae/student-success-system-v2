-- Add is_popup column to notices table
ALTER TABLE notices_2025_11_27_07_17 
ADD COLUMN IF NOT EXISTS is_popup BOOLEAN DEFAULT FALSE;

-- Update existing notices to have is_popup = false
UPDATE notices_2025_11_27_07_17 
SET is_popup = FALSE 
WHERE is_popup IS NULL;
