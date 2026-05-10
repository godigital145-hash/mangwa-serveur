-- Add responsive image fields to hero_sections
ALTER TABLE hero_sections ADD COLUMN image_desktop TEXT;
ALTER TABLE hero_sections ADD COLUMN image_tablet  TEXT;
ALTER TABLE hero_sections ADD COLUMN image_mobile  TEXT;

-- Migrate existing background_image into image_desktop
UPDATE hero_sections SET image_desktop = background_image WHERE background_image IS NOT NULL;
