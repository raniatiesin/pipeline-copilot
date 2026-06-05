-- ============================================================
-- PIPELINE COPILOT — SUPABASE SCHEMA
-- ============================================================
-- Run this entire file in your Supabase SQL editor.
-- One row per project. Stage state stored in card_statuses JSON.
-- PowerSync publication at the bottom must be created after the table.
-- ============================================================

-- Drop old tables if present
DROP TABLE IF EXISTS client_sessions CASCADE;
DROP TABLE IF EXISTS style_selections CASCADE;

-- ============================================================
-- pipelines table
-- ============================================================

CREATE TABLE IF NOT EXISTS pipelines (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_name         TEXT NOT NULL DEFAULT '',
  post_name             TEXT NOT NULL DEFAULT '',
  script                TEXT NOT NULL DEFAULT '',

  -- Stage outputs (JSON blobs, populated as the user completes each card)
  style_selection       JSONB DEFAULT NULL,   -- { collageId, tagTally }
  beat_butcher_output   JSONB DEFAULT NULL,   -- Scene[]
  entity_editor_output  JSONB DEFAULT NULL,   -- SubjectCategory[]
  arc_assembler_output  JSONB DEFAULT NULL,   -- { sceneBriefs[], subjectBriefs[] }

  -- Per-stage card state (progress, approval, outdated, notes)
  -- Shape: { [moduleId]: { progress, isApproved, isOutdated, quickNote } }
  card_statuses         JSONB DEFAULT '{}'::jsonb,

  created_at            TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Index for ordered listing
CREATE INDEX IF NOT EXISTS idx_pipelines_created_at ON pipelines (created_at DESC);

-- ============================================================
-- Row-level security (anon access — app uses anonymous auth)
-- ============================================================

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_pipelines" ON pipelines;
CREATE POLICY "allow_all_pipelines" ON pipelines FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- PowerSync — full replica identity + publication
-- ============================================================

-- PowerSync requires FULL replica identity to track deletes
ALTER TABLE pipelines REPLICA IDENTITY FULL;

-- Create (or replace) the PowerSync publication
-- Name must match what you configured in the PowerSync dashboard
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
    CREATE PUBLICATION powersync FOR TABLE pipelines;
  ELSE
    ALTER PUBLICATION powersync ADD TABLE pipelines;
  END IF;
END;
$$;

-- ============================================================
-- updated_at auto-trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pipelines_updated_at ON pipelines;
CREATE TRIGGER pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
