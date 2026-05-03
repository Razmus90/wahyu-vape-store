-- Create WhatsApp settings table for WAHA configuration
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waha_api_url TEXT DEFAULT 'http://localhost:3001',
  waha_api_key TEXT,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_id ON whatsapp_settings(id);
