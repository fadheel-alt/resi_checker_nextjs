-- Migration: Add buyer_user_name, jumlah, and shipping_method columns to orders table
-- Created: 2026-01-19

-- Add new columns to the orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS buyer_user_name TEXT,
ADD COLUMN IF NOT EXISTS jumlah TEXT,
ADD COLUMN IF NOT EXISTS shipping_method TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN orders.buyer_user_name IS 'Username of the buyer';
COMMENT ON COLUMN orders.jumlah IS 'Quantity or amount of items';
COMMENT ON COLUMN orders.shipping_method IS 'Shipping/courier method used';
