-- Create PostgreSQL DDL for event places platform
-- Compatible with PostgreSQL 13+
-- Notes:
-- - Uses UUID primary keys (requires pgcrypto extension)
-- - Uses soft-delete via deleted_at on major tables
-- - Uses reference tables for types/categories/status where useful
-- - Includes basic indexes and constraints

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- =========================
-- Reference / Catalog tables
-- =========================

CREATE TABLE IF NOT EXISTS roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          varchar(50) NOT NULL UNIQUE, -- e.g., ADMIN, OWNER, USER
  name          varchar(100) NOT NULL,
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code  char(2) NOT NULL, -- ISO-3166-1 alpha-2, e.g., CO
  name          varchar(120) NOT NULL,
  state_region  varchar(120),
  timezone      varchar(64) NOT NULL DEFAULT 'America/Bogota',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country_code, name, COALESCE(state_region, ''))
);

CREATE TABLE IF NOT EXISTS place_types (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          varchar(50) NOT NULL UNIQUE, -- BAR, CAFE, CLUB, OTHER
  name          varchar(100) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          varchar(50) NOT NULL UNIQUE, -- SALSA, TECHNO, STANDUP...
  name          varchar(100) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- Users / Auth
-- =========================

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext UNIQUE,
  phone         varchar(30),
  password_hash text, -- nullable if using OAuth / passwordless
  full_name     varchar(160),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- =========================
-- Places
-- =========================

-- Status for moderation/publication:
-- DRAFT: visible only to owner/admin
-- PUBLISHED: visible to public
-- SUSPENDED: hidden
CREATE TABLE IF NOT EXISTS places (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  city_id         uuid NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  place_type_id   uuid NOT NULL REFERENCES place_types(id) ON DELETE RESTRICT,

  name            varchar(180) NOT NULL,
  slug            varchar(220) NOT NULL,
  description     text,
  address_line    varchar(240),
  neighborhood    varchar(140),
  latitude        numeric(9,6),
  longitude       numeric(9,6),

  price_level     smallint, -- 1..5 optional
  status          varchar(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT|PUBLISHED|SUSPENDED

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,

  CONSTRAINT places_status_chk CHECK (status IN ('DRAFT','PUBLISHED','SUSPENDED')),
  CONSTRAINT places_price_level_chk CHECK (price_level IS NULL OR (price_level BETWEEN 1 AND 5)),
  UNIQUE(city_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_places_city_type ON places(city_id, place_type_id);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_places_geo ON places(latitude, longitude);

CREATE TABLE IF NOT EXISTS place_contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  contact_type  varchar(30) NOT NULL, -- WHATSAPP|PHONE|EMAIL|WEBSITE
  label         varchar(80),
  value         varchar(240) NOT NULL,
  is_primary    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT place_contacts_type_chk CHECK (contact_type IN ('WHATSAPP','PHONE','EMAIL','WEBSITE'))
);

CREATE INDEX IF NOT EXISTS idx_place_contacts_place ON place_contacts(place_id);

-- Ensure only one primary per place (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS uq_place_contacts_primary_per_place
ON place_contacts(place_id)
WHERE is_primary = true;

CREATE TABLE IF NOT EXISTS place_social_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  platform      varchar(30) NOT NULL, -- INSTAGRAM|FACEBOOK|TIKTOK|X|YOUTUBE|OTHER
  url           varchar(400) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT place_social_platform_chk CHECK (platform IN ('INSTAGRAM','FACEBOOK','TIKTOK','X','YOUTUBE','OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_place_social_place ON place_social_links(place_id);

CREATE TABLE IF NOT EXISTS place_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  url           varchar(500) NOT NULL,
  alt_text      varchar(200),
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_place_photos_place ON place_photos(place_id);

-- Opening hours by weekday (0=Sunday .. 6=Saturday)
CREATE TABLE IF NOT EXISTS opening_hours (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  weekday       smallint NOT NULL,
  open_time     time,
  close_time    time,
  is_closed     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT opening_hours_weekday_chk CHECK (weekday BETWEEN 0 AND 6),
  UNIQUE(place_id, weekday)
);

-- =========================
-- Events
-- =========================

CREATE TABLE IF NOT EXISTS events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  category_id     uuid REFERENCES event_categories(id) ON DELETE SET NULL,

  title           varchar(200) NOT NULL,
  description     text,
  dress_code      varchar(120),
  min_age         smallint,
  currency        char(3) NOT NULL DEFAULT 'COP',
  price_from      numeric(12,2),
  price_to        numeric(12,2),

  start_time      time NOT NULL,
  end_time        time,

  status          varchar(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|CANCELLED|SUSPENDED
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,

  CONSTRAINT events_status_chk CHECK (status IN ('ACTIVE','CANCELLED','SUSPENDED')),
  CONSTRAINT events_min_age_chk CHECK (min_age IS NULL OR (min_age BETWEEN 0 AND 99)),
  CONSTRAINT events_price_chk CHECK (
    (price_from IS NULL OR price_from >= 0) AND
    (price_to   IS NULL OR price_to   >= 0) AND
    (price_from IS NULL OR price_to IS NULL OR price_to >= price_from)
  )
);

CREATE INDEX IF NOT EXISTS idx_events_place ON events(place_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Weekly recurrence: exactly one row per event if it recurs weekly
CREATE TABLE IF NOT EXISTS event_recurrences (
  event_id      uuid PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  weekday       smallint NOT NULL, -- 0..6
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_recurrences_weekday_chk CHECK (weekday BETWEEN 0 AND 6)
);

-- Specific dates and exceptions:
-- - date_type = OCCURRENCE: event happens on this specific date (useful for one-off)
-- - date_type = EXCEPTION: event does NOT happen on this date (skip a recurrence)
CREATE TABLE IF NOT EXISTS event_special_dates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_date    date NOT NULL,
  date_type     varchar(20) NOT NULL DEFAULT 'OCCURRENCE', -- OCCURRENCE|EXCEPTION
  note          varchar(250),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_special_dates_type_chk CHECK (date_type IN ('OCCURRENCE','EXCEPTION')),
  UNIQUE(event_id, event_date, date_type)
);

CREATE INDEX IF NOT EXISTS idx_event_special_dates_date ON event_special_dates(event_date);
CREATE INDEX IF NOT EXISTS idx_event_special_dates_event ON event_special_dates(event_id);

-- =========================
-- User interactions
-- =========================

CREATE TABLE IF NOT EXISTS favorites (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id    uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, place_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  target_type   varchar(20) NOT NULL, -- PLACE|EVENT
  place_id      uuid REFERENCES places(id) ON DELETE CASCADE,
  event_id      uuid REFERENCES events(id) ON DELETE CASCADE,
  reason        varchar(80) NOT NULL, -- WRONG_INFO|SPAM|INAPPROPRIATE|CLOSED|OTHER
  details       text,
  status        varchar(20) NOT NULL DEFAULT 'OPEN', -- OPEN|IN_REVIEW|RESOLVED|REJECTED
  created_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz,
  CONSTRAINT reports_target_type_chk CHECK (target_type IN ('PLACE','EVENT')),
  CONSTRAINT reports_reason_chk CHECK (reason IN ('WRONG_INFO','SPAM','INAPPROPRIATE','CLOSED','OTHER')),
  CONSTRAINT reports_status_chk CHECK (status IN ('OPEN','IN_REVIEW','RESOLVED','REJECTED')),
  CONSTRAINT reports_target_fk_chk CHECK (
    (target_type = 'PLACE' AND place_id IS NOT NULL AND event_id IS NULL) OR
    (target_type = 'EVENT'  AND event_id IS NOT NULL  AND place_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_place ON reports(place_id);
CREATE INDEX IF NOT EXISTS idx_reports_event ON reports(event_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type    varchar(40) NOT NULL, -- PLACE_VIEW|EVENT_VIEW|CONTACT_CLICK|FAVORITE_ADD
  place_id      uuid REFERENCES places(id) ON DELETE SET NULL,
  event_id      uuid REFERENCES events(id) ON DELETE SET NULL,
  meta          jsonb,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT analytics_event_type_chk CHECK (
    event_type IN ('PLACE_VIEW','EVENT_VIEW','CONTACT_CLICK','FAVORITE_ADD','FAVORITE_REMOVE','REPORT_CREATE')
  )
);

CREATE INDEX IF NOT EXISTS idx_analytics_occurred ON analytics_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_place ON analytics_events(place_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event_id);

-- =========================
-- Audit log (admin/owner actions)
-- =========================

CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action        varchar(60) NOT NULL, -- PLACE_CREATE, PLACE_UPDATE, EVENT_UPDATE, etc.
  entity_type   varchar(30) NOT NULL, -- PLACE|EVENT|USER|...
  entity_id     uuid NOT NULL,
  before_data   jsonb,
  after_data    jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- =========================
-- Helpful updated_at trigger
-- =========================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_places_updated_at') THEN
    CREATE TRIGGER trg_places_updated_at
    BEFORE UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_events_updated_at') THEN
    CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
