-- Add product_display column to chat_settings for controlling user page product visibility
ALTER TABLE chat_settings ADD COLUMN IF NOT EXISTS product_display JSONB DEFAULT '{"show_out_of_stock": true}';

-- Optional: Update existing rows to have the default value if null
UPDATE chat_settings SET product_display = '{"show_out_of_stock": true}' WHERE product_display IS NULL;
