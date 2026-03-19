-- Add images array column to courts table
-- This is a targeted, additive migration for courts.images
-- Safe to run on existing databases (uses IF NOT EXISTS)
ALTER TABLE "courts" ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT '{}';
