-- Add payment_gateway column to admin_users for toggle between midtrans/ipaymu
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'ipaymu' CHECK (payment_gateway IN ('midtrans', 'ipaymu'));
