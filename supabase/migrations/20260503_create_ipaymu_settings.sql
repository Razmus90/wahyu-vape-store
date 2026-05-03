CREATE TABLE IF NOT EXISTS ipaymu_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_production BOOLEAN DEFAULT false,
  sb_api_key TEXT DEFAULT '',
  sb_va TEXT DEFAULT '',
  sb_mode TEXT DEFAULT 'sandbox',
  pr_api_key TEXT DEFAULT '',
  pr_va TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ipaymu_settings_id ON ipaymu_settings(id);
