-- Migration: Add variation_name and receiver_name columns to orders table
-- Date: 2026-01-19
-- Description: Adds support for storing product variation names and receiver names

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS variation_name TEXT,
ADD COLUMN IF NOT EXISTS receiver_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN orders.variation_name IS 'Product variation name extracted from product_info column (e.g., "Flamingo,180x120x10 - 2 orang")';
COMMENT ON COLUMN orders.receiver_name IS 'Name of the order receiver/customer';
