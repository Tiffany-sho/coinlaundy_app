# Supabase Migrations

This directory contains the SQL migration files for the Collecie app.  
Run them **in order** using the Supabase Dashboard SQL Editor.

## How to Run

1. Open your project in the [Supabase Dashboard](https://app.supabase.com).
2. Navigate to **SQL Editor** in the left sidebar.
3. Click **New query**, paste the contents of each file in the order below, and click **Run**.

### Execution Order

| Order | File | Description |
|-------|------|-------------|
| 1 | `migrations/001_tables.sql` | Creates all tables, trigger functions, and `updated_at` / `handle_new_user` triggers |
| 2 | `migrations/002_rls.sql` | Enables Row Level Security and creates access policies for all tables |
| 3 | `migrations/003_storage.sql` | Creates the `laundry-images` storage bucket and its access policies |

## Notes

- All files are idempotent. You can re-run them safely: tables use `CREATE TABLE IF NOT EXISTS`, policies use `DROP POLICY IF EXISTS` before creation, and the bucket insert uses `ON CONFLICT DO NOTHING`.
- The `handle_new_user` trigger automatically creates a row in `public.profiles` whenever a new user signs up via Supabase Auth.
- The `updated_at` column on `machines`, `laundry_inventory`, and `profiles` is kept current automatically via the `handle_updated_at` trigger.
