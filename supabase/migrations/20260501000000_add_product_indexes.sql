-- Add indexes for product search optimization
CREATE INDEX IF NOT EXISTS idx_products_klasifikasi ON products_cache(klasifikasi);
CREATE INDEX IF NOT EXISTS idx_products_category ON products_cache(category);
CREATE INDEX IF NOT EXISTS idx_products_brand_name ON products_cache(brand_name);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products_cache(created_at DESC);
