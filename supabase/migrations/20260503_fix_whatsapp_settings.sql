-- Fix: Drop old table if exists, recreate with correct structure
DROP TABLE IF EXISTS whatsapp_settings;

CREATE TABLE whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waha_api_url TEXT DEFAULT 'http://localhost:3001',
  waha_api_key TEXT,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_id ON whatsapp_settings(id);

-- Ensure sessions table exists
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT DEFAULT 'default',
  status TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_name ON whatsapp_sessions(session_name);

-- Ensure messages table exists
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  from_me BOOLEAN DEFAULT false,
  message TEXT,
  media_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
