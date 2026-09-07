-- Supabase PostgreSQL Schema & Security for GDG Game Arcade

-- 1. Create tables
CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  code CHAR(6) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_code ON players (code);

CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_slug VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_player_game UNIQUE (player_id, game_slug)
);

CREATE INDEX IF NOT EXISTS idx_scores_player_id ON scores (player_id);
CREATE INDEX IF NOT EXISTS idx_scores_game_slug_score ON scores (game_slug, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_game_slug_score_asc ON scores (game_slug, score ASC);

-- 2. Security & Hardening (Principle of Least Privilege)
-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Revoke all direct permissions from anon and authenticated roles.
-- External public requests via PostgREST cannot read or modify any player data or codes.
-- Access is strictly mediated through Next.js server-side API routes using connection pooling.
REVOKE ALL ON TABLE players, scores FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
