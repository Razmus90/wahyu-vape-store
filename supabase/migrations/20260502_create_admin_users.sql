-- Create admin_users table for secure admin authentication
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  reset_token TEXT,
  reset_expires_at TIMESTAMPTZ,
  store_name TEXT DEFAULT 'Wahyu Vape Store',
  store_contact TEXT,
  store_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only service role can access (admin APIs use supabaseAdmin)
CREATE POLICY "Service role only" ON admin_users
  FOR ALL USING (auth.role() = 'service_role');

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_reset_token ON admin_users(reset_token);

-- Insert initial admin from env vars (run after table created)
-- Replace 'admin' and 'hash_of_admin123' with actual values
-- INSERT INTO admin_users (username, password_hash)
-- VALUES ('admin', '<hash_of_admin123>')
-- ON CONFLICT (username) DO NOTHING;
