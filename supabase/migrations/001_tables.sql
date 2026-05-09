-- =============================================================
-- 001_tables.sql
-- Creates all tables for the Collecie coin laundry app.
-- Run this file first in the Supabase SQL Editor.
-- =============================================================

-- -------------------------------------------------------------
-- Trigger function: auto-create a profile row when a new user
-- signs up via Supabase Auth.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Apply the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------
-- Trigger function: keep updated_at current on UPDATE.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================
-- Tables (ordered to respect foreign-key dependencies)
-- =============================================================

-- -------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           text,
  username            text,
  phone_number        text,
  avatar_url          text,
  notification_email  text,
  role                text CHECK (role IN ('admin', 'collecter', 'viewer')),
  collect_method      text CHECK (collect_method IN ('machines', 'total')),
  track_denominations boolean NOT NULL DEFAULT false,
  collection_cycle    text CHECK (collection_cycle IN ('weekly', 'monthly')),
  updated_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------------
-- organizations
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  owner_id   uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- organization_members
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      text NOT NULL CHECK (role IN ('admin', 'collecter', 'viewer')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- -------------------------------------------------------------
-- organization_invitations
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email        text NOT NULL,
  invite_token text NOT NULL UNIQUE,
  role         text NOT NULL CHECK (role IN ('admin', 'collecter', 'viewer')),
  inviter_id   uuid NOT NULL REFERENCES auth.users(id),
  expires_at   timestamptz NOT NULL,
  accepted_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- laundry_store
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.laundry_store (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id        uuid NOT NULL REFERENCES auth.users(id),
  name            text NOT NULL,
  location        text NOT NULL,
  description     text NOT NULL DEFAULT '',
  images          jsonb NOT NULL DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- machines
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.machines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laundry_id  uuid NOT NULL REFERENCES public.laundry_store(id) ON DELETE CASCADE,
  name        text NOT NULL,
  unit_count  integer NOT NULL DEFAULT 1,
  is_broken   boolean NOT NULL DEFAULT false,
  comment     text,
  sort_order  integer NOT NULL DEFAULT 0,
  updated_by  uuid REFERENCES auth.users(id),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at_machines ON public.machines;
CREATE TRIGGER set_updated_at_machines
  BEFORE UPDATE ON public.machines
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------------
-- inventory_types
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_types (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  unit            text NOT NULL DEFAULT '個',
  alert_threshold integer NOT NULL DEFAULT 2,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

-- -------------------------------------------------------------
-- laundry_inventory
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.laundry_inventory (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laundry_id        uuid NOT NULL REFERENCES public.laundry_store(id) ON DELETE CASCADE,
  inventory_type_id uuid NOT NULL REFERENCES public.inventory_types(id) ON DELETE CASCADE,
  quantity          integer NOT NULL DEFAULT 0,
  updated_by        uuid REFERENCES auth.users(id),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (laundry_id, inventory_type_id)
);

DROP TRIGGER IF EXISTS set_updated_at_laundry_inventory ON public.laundry_inventory;
CREATE TRIGGER set_updated_at_laundry_inventory
  BEFORE UPDATE ON public.laundry_inventory
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------------
-- collect_funds
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collect_funds (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laundry_id   uuid NOT NULL REFERENCES public.laundry_store(id) ON DELETE CASCADE,
  collected_at timestamptz NOT NULL,
  total_funds  bigint NOT NULL,
  funds_array  jsonb NOT NULL DEFAULT '[]',
  collector_id uuid NOT NULL REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- action_message
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.action_message (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id      uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  message     text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
