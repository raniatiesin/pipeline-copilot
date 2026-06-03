-- Supabase SQL Schema for Style Selector App
-- Run this in your Supabase SQL editor to set up the database

-- Create client_sessions table
CREATE TABLE client_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  search_prompt TEXT NOT NULL,
  selected_tags JSONB DEFAULT '[]'::jsonb,
  selected_style_id TEXT,
  selected_style_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_client_sessions_client_name ON client_sessions(client_name);
CREATE INDEX idx_client_sessions_created_at ON client_sessions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on client_sessions" ON client_sessions
  FOR ALL USING (true);

-- Optional: Create a view for recent sessions
CREATE OR REPLACE VIEW recent_sessions AS
SELECT 
  id,
  client_name,
  search_prompt,
  selected_tags,
  selected_style_id,
  selected_style_url,
  created_at
FROM client_sessions
ORDER BY created_at DESC
LIMIT 100;