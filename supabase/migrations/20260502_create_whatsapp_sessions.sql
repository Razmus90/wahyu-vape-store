-- Create WhatsApp sessions table for waha-core integration
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT DEFAULT 'default',
  status TEXT,  -- STARTING, WORKING, FAILED, SCAN_QR_CODE
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_name ON whatsapp_sessions(session_name);
