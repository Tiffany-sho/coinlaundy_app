-- =============================================================
-- 002_rls.sql
-- Enables Row Level Security and creates access policies.
-- Run this file AFTER 001_tables.sql.
-- =============================================================

-- -------------------------------------------------------------
-- Enable RLS on all tables
-- -------------------------------------------------------------
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laundry_store          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laundry_inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collect_funds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_message         ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- Helper: drop old policy if it exists so this script is
-- idempotent (Supabase / PostgreSQL 14 does not support
-- CREATE POLICY IF NOT EXISTS).
-- =============================================================

-- =============================================================
-- profiles
-- =============================================================
DROP POLICY IF EXISTS "profiles: users can view own profile"    ON public.profiles;
DROP POLICY IF EXISTS "profiles: users can update own profile"  ON public.profiles;

CREATE POLICY "profiles: users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =============================================================
-- organizations
-- =============================================================
DROP POLICY IF EXISTS "organizations: members can view"   ON public.organizations;
DROP POLICY IF EXISTS "organizations: owner can update"   ON public.organizations;
DROP POLICY IF EXISTS "organizations: owner can delete"   ON public.organizations;
DROP POLICY IF EXISTS "organizations: authenticated can create" ON public.organizations;

CREATE POLICY "organizations: members can view"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "organizations: authenticated can create"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "organizations: owner can update"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "organizations: owner can delete"
  ON public.organizations FOR DELETE
  USING (owner_id = auth.uid());

-- =============================================================
-- organization_members
-- =============================================================
DROP POLICY IF EXISTS "org_members: members can view"    ON public.organization_members;
DROP POLICY IF EXISTS "org_members: admin can insert"    ON public.organization_members;
DROP POLICY IF EXISTS "org_members: admin can update"    ON public.organization_members;
DROP POLICY IF EXISTS "org_members: admin can delete"    ON public.organization_members;

CREATE POLICY "org_members: members can view"
  ON public.organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "org_members: admin can insert"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

CREATE POLICY "org_members: admin can update"
  ON public.organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

CREATE POLICY "org_members: admin can delete"
  ON public.organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- =============================================================
-- organization_invitations
-- =============================================================
DROP POLICY IF EXISTS "org_invitations: admin can view"             ON public.organization_invitations;
DROP POLICY IF EXISTS "org_invitations: invited email can view own" ON public.organization_invitations;
DROP POLICY IF EXISTS "org_invitations: admin can insert"           ON public.organization_invitations;
DROP POLICY IF EXISTS "org_invitations: admin can delete"           ON public.organization_invitations;

CREATE POLICY "org_invitations: admin can view"
  ON public.organization_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Allow invited user to see their own invitation (matched by email)
CREATE POLICY "org_invitations: invited email can view own"
  ON public.organization_invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "org_invitations: admin can insert"
  ON public.organization_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

CREATE POLICY "org_invitations: admin can delete"
  ON public.organization_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- =============================================================
-- laundry_store
-- =============================================================
DROP POLICY IF EXISTS "laundry_store: members can select"  ON public.laundry_store;
DROP POLICY IF EXISTS "laundry_store: admin can insert"    ON public.laundry_store;
DROP POLICY IF EXISTS "laundry_store: admin can update"    ON public.laundry_store;
DROP POLICY IF EXISTS "laundry_store: admin can delete"    ON public.laundry_store;

CREATE POLICY "laundry_store: members can select"
  ON public.laundry_store FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "laundry_store: admin can insert"
  ON public.laundry_store FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

CREATE POLICY "laundry_store: admin can update"
  ON public.laundry_store FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

CREATE POLICY "laundry_store: admin can delete"
  ON public.laundry_store FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- =============================================================
-- machines
-- =============================================================
DROP POLICY IF EXISTS "machines: members can select"       ON public.machines;
DROP POLICY IF EXISTS "machines: admin can insert"         ON public.machines;
DROP POLICY IF EXISTS "machines: admin or collecter update" ON public.machines;
DROP POLICY IF EXISTS "machines: admin can delete"         ON public.machines;

CREATE POLICY "machines: members can select"
  ON public.machines FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "machines: admin can insert"
  ON public.machines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

CREATE POLICY "machines: admin or collecter update"
  ON public.machines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'collecter')
    )
  );

CREATE POLICY "machines: admin can delete"
  ON public.machines FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- =============================================================
-- inventory_types
-- =============================================================
DROP POLICY IF EXISTS "inventory_types: members can select" ON public.inventory_types;
DROP POLICY IF EXISTS "inventory_types: admin can insert"   ON public.inventory_types;
DROP POLICY IF EXISTS "inventory_types: admin can update"   ON public.inventory_types;
DROP POLICY IF EXISTS "inventory_types: admin can delete"   ON public.inventory_types;

CREATE POLICY "inventory_types: members can select"
  ON public.inventory_types FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "inventory_types: admin can insert"
  ON public.inventory_types FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

CREATE POLICY "inventory_types: admin can update"
  ON public.inventory_types FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

CREATE POLICY "inventory_types: admin can delete"
  ON public.inventory_types FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- =============================================================
-- laundry_inventory
-- =============================================================
DROP POLICY IF EXISTS "laundry_inventory: members can select"          ON public.laundry_inventory;
DROP POLICY IF EXISTS "laundry_inventory: admin or collecter can update" ON public.laundry_inventory;

CREATE POLICY "laundry_inventory: members can select"
  ON public.laundry_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "laundry_inventory: admin or collecter can update"
  ON public.laundry_inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'collecter')
    )
  );

-- =============================================================
-- collect_funds
-- =============================================================
DROP POLICY IF EXISTS "collect_funds: members can select"             ON public.collect_funds;
DROP POLICY IF EXISTS "collect_funds: admin or collecter can insert"  ON public.collect_funds;
DROP POLICY IF EXISTS "collect_funds: collector can update own"       ON public.collect_funds;
DROP POLICY IF EXISTS "collect_funds: admin can update all"           ON public.collect_funds;
DROP POLICY IF EXISTS "collect_funds: collector can delete own"       ON public.collect_funds;
DROP POLICY IF EXISTS "collect_funds: admin can delete all"           ON public.collect_funds;

CREATE POLICY "collect_funds: members can select"
  ON public.collect_funds FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "collect_funds: admin or collecter can insert"
  ON public.collect_funds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'collecter')
    )
  );

CREATE POLICY "collect_funds: collector can update own"
  ON public.collect_funds FOR UPDATE
  USING (
    collector_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
        AND om.role = 'collecter'
    )
  );

CREATE POLICY "collect_funds: admin can update all"
  ON public.collect_funds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

CREATE POLICY "collect_funds: collector can delete own"
  ON public.collect_funds FOR DELETE
  USING (
    collector_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
        AND om.role = 'collecter'
    )
  );

CREATE POLICY "collect_funds: admin can delete all"
  ON public.collect_funds FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.laundry_store ls
      JOIN public.organization_members om ON om.org_id = ls.organization_id
      WHERE ls.id = laundry_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- =============================================================
-- action_message
-- =============================================================
DROP POLICY IF EXISTS "action_message: members can select"            ON public.action_message;
DROP POLICY IF EXISTS "action_message: admin or collecter can insert" ON public.action_message;

CREATE POLICY "action_message: members can select"
  ON public.action_message FOR SELECT
  USING (
    org_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "action_message: admin or collecter can insert"
  ON public.action_message FOR INSERT
  WITH CHECK (
    org_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'collecter')
    )
  );
