-- Rignum DB Schema (PostgreSQL)
-- Notes:
-- 1) Store metadata + external link only (no third-party text is hosted/reproduced).
-- 2) Retention: 24h via expires_at.
-- 3) Visibility levels: 0 normal, 1 limited, 2 soft-removed, 3 hard-removed.

-- Optional extensions (choose what your provider supports)
-- For UUID generation:
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- If you want fast text search later:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================
-- 1) Sources
-- =========================
CREATE TABLE IF NOT EXISTS sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                 -- e.g., "Reddit", "X", "Telegram"
  source_type     TEXT NOT NULL,                 -- Forum | Chat Platform | Social Network | News Website | Blog | Other
  base_url        TEXT,                          -- e.g., "https://reddit.com"
  is_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sources_name_unique UNIQUE (name),
  CONSTRAINT sources_type_check CHECK (source_type IN (
    'Forum','Chat Platform','Social Network','News Website','Blog','Other'
  ))
);

-- =========================
-- 2) Items (Feed cards)
-- =========================
CREATE TABLE IF NOT EXISTS items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source & link
  source_id          UUID NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  external_url       TEXT NOT NULL,
  external_url_hash  TEXT NOT NULL,              -- SHA256(url) hex (dedupe)

  -- Timing
  captured_at        TIMESTAMPTZ NOT NULL DEFAULT now(), -- when we indexed it
  source_published_at TIMESTAMPTZ,               -- if known
  expires_at         TIMESTAMPTZ NOT NULL,       -- captured_at + interval '24 hours'

  -- Classification (strict whitelist values)
  content_label      TEXT NOT NULL,              -- Rumor | Opinion | Claim | Question | Announcement
  market_category    TEXT NOT NULL,              -- Stocks | Crypto | FX | Commodities | Macro | Multi-market

  -- Visibility control
  visibility_level   SMALLINT NOT NULL DEFAULT 0, -- 0..3
  is_hidden          BOOLEAN NOT NULL DEFAULT FALSE, -- additional switch (optional)

  -- Metadata (no summaries, no text)
  entities           JSONB NOT NULL DEFAULT '{}'::jsonb,
  topics             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  flags              TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Risk signals (drive visibility logic)
  risk_signals       JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Operational fields
  status             TEXT NOT NULL DEFAULT 'PUBLISHED', -- NEW | CLASSIFIED | PUBLISHED | FAILED | REMOVED
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT items_external_url_hash_unique UNIQUE (external_url_hash),
  CONSTRAINT items_content_label_check CHECK (content_label IN (
    'Rumor','Opinion','Claim','Question','Announcement'
  )),
  CONSTRAINT items_market_category_check CHECK (market_category IN (
    'Stocks','Crypto','FX','Commodities','Macro','Multi-market'
  )),
  CONSTRAINT items_visibility_level_check CHECK (visibility_level BETWEEN 0 AND 3),
  CONSTRAINT items_status_check CHECK (status IN (
    'NEW','CLASSIFIED','PUBLISHED','FAILED','REMOVED'
  ))
);

-- Helpful indexes for feed filters
CREATE INDEX IF NOT EXISTS idx_items_captured_at ON items (captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_expires_at ON items (expires_at);
CREATE INDEX IF NOT EXISTS idx_items_source_id ON items (source_id);
CREATE INDEX IF NOT EXISTS idx_items_market_category ON items (market_category);
CREATE INDEX IF NOT EXISTS idx_items_content_label ON items (content_label);
CREATE INDEX IF NOT EXISTS idx_items_visibility_level ON items (visibility_level);
CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);

-- JSONB indexes (for entities/risk_signals)
CREATE INDEX IF NOT EXISTS idx_items_entities_gin ON items USING GIN (entities);
CREATE INDEX IF NOT EXISTS idx_items_risk_signals_gin ON items USING GIN (risk_signals);

-- Arrays (topics/flags)
CREATE INDEX IF NOT EXISTS idx_items_topics_gin ON items USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_items_flags_gin ON items USING GIN (flags);

-- =========================
-- 3) Reports (user reports)
-- =========================
CREATE TABLE IF NOT EXISTS reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        UUID REFERENCES items(id) ON DELETE SET NULL,

  reporter_email TEXT,                 -- optional
  reason         TEXT NOT NULL,         -- short reason category or free text
  details        TEXT,                 -- optional details
  status         TEXT NOT NULL DEFAULT 'OPEN', -- OPEN | REVIEWING | CLOSED
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT reports_status_check CHECK (status IN ('OPEN','REVIEWING','CLOSED'))
);

CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports (status, created_at DESC);

-- =========================
-- 4) Legal notices / takedown
-- =========================
CREATE TABLE IF NOT EXISTS legal_notices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID REFERENCES items(id) ON DELETE SET NULL,

  requester_name  TEXT,
  requester_email TEXT,
  legal_basis      TEXT,               -- e.g. "defamation", "copyright", "unlawful content"
  service_urls     TEXT,               -- URLs on your service
  external_urls    TEXT,               -- external source URLs
  message          TEXT,
  status           TEXT NOT NULL DEFAULT 'RECEIVED', -- RECEIVED | REVIEWING | ACTIONED | REJECTED
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT legal_notices_status_check CHECK (status IN ('RECEIVED','REVIEWING','ACTIONED','REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_legal_notices_status_created ON legal_notices (status, created_at DESC);

-- =========================
-- 5) Jobs (optional but useful: fetch/classify/cleanup)
-- =========================
CREATE TABLE IF NOT EXISTS jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type     TEXT NOT NULL, -- FETCH | CLASSIFY | CLEANUP
  status       TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | RUNNING | DONE | FAILED
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT jobs_type_check CHECK (job_type IN ('FETCH','CLASSIFY','CLEANUP')),
  CONSTRAINT jobs_status_check CHECK (status IN ('PENDING','RUNNING','DONE','FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_type_status_created ON jobs (job_type, status, created_at DESC);

-- =========================
-- 6) Updated_at trigger (optional)
-- =========================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS trg_items_updated_at ON items;
CREATE TRIGGER trg_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_legal_notices_updated_at ON legal_notices;
CREATE TRIGGER trg_legal_notices_updated_at
BEFORE UPDATE ON legal_notices
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
