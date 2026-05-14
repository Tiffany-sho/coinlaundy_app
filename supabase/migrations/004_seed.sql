-- =============================================================
-- 004_seed.sql
-- Sample data for development / demo.
-- Run in Supabase SQL Editor (executes as superuser, RLS bypassed).
-- Prerequisite: at least one user must be registered in auth.users.
-- If the user already has an organization (created via /setup),
-- sample stores/machines are added to that existing organization.
-- =============================================================

DO $$
DECLARE
  v_user_id        uuid;
  v_org_id         uuid;
  v_store1_id      uuid;
  v_store2_id      uuid;
  v_m1 uuid; v_m2 uuid; v_m3 uuid;
  v_m4 uuid; v_m5 uuid;
  v_it1 uuid; v_it2 uuid; v_it3 uuid;
  v_cf_at          timestamptz;
BEGIN

  -- ----------------------------------------------------------------
  -- 1. Pick the first registered user
  -- ----------------------------------------------------------------
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'ユーザーが見つかりません。先にアカウント登録を行ってください。';
  END IF;

  -- ----------------------------------------------------------------
  -- 2. Profile — update to admin with full settings
  -- ----------------------------------------------------------------
  INSERT INTO public.profiles (
    id, full_name, username, role,
    collect_method, track_denominations, collection_cycle, updated_at
  )
  VALUES (
    v_user_id, '田中 太郎', 'tanaka_taro', 'admin',
    'machines', true, 'monthly', now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name           = EXCLUDED.full_name,
    username            = EXCLUDED.username,
    role                = EXCLUDED.role,
    collect_method      = EXCLUDED.collect_method,
    track_denominations = EXCLUDED.track_denominations,
    collection_cycle    = EXCLUDED.collection_cycle,
    updated_at          = now();

  -- ----------------------------------------------------------------
  -- 3. Organization — reuse existing if present, otherwise create
  -- ----------------------------------------------------------------
  SELECT om.org_id INTO v_org_id
  FROM public.organization_members om
  WHERE om.user_id = v_user_id
  ORDER BY om.joined_at
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, owner_id)
    VALUES ('田中コインランドリー株式会社', v_user_id)
    RETURNING id INTO v_org_id;

    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'admin');
  ELSE
    -- Update org name to match sample data
    UPDATE public.organizations
    SET name = '田中コインランドリー株式会社'
    WHERE id = v_org_id;
  END IF;

  -- ----------------------------------------------------------------
  -- 4. Laundry stores
  -- ----------------------------------------------------------------
  INSERT INTO public.laundry_store (organization_id, owner_id, name, location, description)
  VALUES (v_org_id, v_user_id,
          '田中コインランドリー 渋谷店',
          '東京都渋谷区道玄坂1-2-3',
          '渋谷駅から徒歩5分。24時間営業の大型店舗。')
  RETURNING id INTO v_store1_id;

  INSERT INTO public.laundry_store (organization_id, owner_id, name, location, description)
  VALUES (v_org_id, v_user_id,
          '田中コインランドリー 新宿店',
          '東京都新宿区西新宿2-4-6',
          '新宿駅西口から徒歩3分。駐車場完備。')
  RETURNING id INTO v_store2_id;

  -- ----------------------------------------------------------------
  -- 5. Machines — store 1 (渋谷店)
  -- ----------------------------------------------------------------
  INSERT INTO public.machines (laundry_id, name, unit_count, is_broken, sort_order, updated_by)
  VALUES (v_store1_id, '洗濯機（大）', 3, false, 0, v_user_id)
  RETURNING id INTO v_m1;

  INSERT INTO public.machines (laundry_id, name, unit_count, is_broken, sort_order, updated_by)
  VALUES (v_store1_id, '洗濯機（小）', 2, false, 1, v_user_id)
  RETURNING id INTO v_m2;

  INSERT INTO public.machines (laundry_id, name, unit_count, is_broken, sort_order, comment, updated_by)
  VALUES (v_store1_id, '乾燥機', 4, true, 2, 'ドア故障中。修理業者手配済み（今週中に修理予定）', v_user_id)
  RETURNING id INTO v_m3;

  -- Machines — store 2 (新宿店)
  INSERT INTO public.machines (laundry_id, name, unit_count, is_broken, sort_order, updated_by)
  VALUES (v_store2_id, '洗濯機', 4, false, 0, v_user_id)
  RETURNING id INTO v_m4;

  INSERT INTO public.machines (laundry_id, name, unit_count, is_broken, sort_order, updated_by)
  VALUES (v_store2_id, '乾燥機', 3, false, 1, v_user_id)
  RETURNING id INTO v_m5;

  -- ----------------------------------------------------------------
  -- 6. Inventory types
  -- ----------------------------------------------------------------
  INSERT INTO public.inventory_types (org_id, name, unit, alert_threshold, sort_order)
  VALUES (v_org_id, '洗剤', '袋', 3, 0)
  RETURNING id INTO v_it1;

  INSERT INTO public.inventory_types (org_id, name, unit, alert_threshold, sort_order)
  VALUES (v_org_id, '柔軟剤', '本', 2, 1)
  RETURNING id INTO v_it2;

  INSERT INTO public.inventory_types (org_id, name, unit, alert_threshold, sort_order)
  VALUES (v_org_id, 'ゴミ袋', '束', 2, 2)
  RETURNING id INTO v_it3;

  -- ----------------------------------------------------------------
  -- 7. Laundry inventory
  -- ----------------------------------------------------------------
  INSERT INTO public.laundry_inventory (laundry_id, inventory_type_id, quantity, updated_by)
  VALUES
    (v_store1_id, v_it1, 5, v_user_id),
    (v_store1_id, v_it2, 1, v_user_id),  -- 低在庫アラート
    (v_store1_id, v_it3, 3, v_user_id),
    (v_store2_id, v_it1, 8, v_user_id),
    (v_store2_id, v_it2, 0, v_user_id),  -- 低在庫アラート（0本）
    (v_store2_id, v_it3, 2, v_user_id);

  -- ----------------------------------------------------------------
  -- 8. Collection records — 3 months of data
  -- ----------------------------------------------------------------

  -- 2 months ago
  v_cf_at := date_trunc('month', now() AT TIME ZONE 'Asia/Tokyo')
               AT TIME ZONE 'Asia/Tokyo' - interval '2 months' + interval '3 days';
  INSERT INTO public.collect_funds (laundry_id, collected_at, total_funds, funds_array, collector_id)
  VALUES (
    v_store1_id, v_cf_at, 38400,
    jsonb_build_array(
      jsonb_build_object('machine_id', v_m1, 'name', '洗濯機（大）', 'amount', 18000,
        'denominations', '{"10":0,"50":0,"100":30,"500":20,"1000":5}'::jsonb),
      jsonb_build_object('machine_id', v_m2, 'name', '洗濯機（小）', 'amount', 12000,
        'denominations', '{"10":0,"50":0,"100":20,"500":16,"1000":2}'::jsonb),
      jsonb_build_object('machine_id', v_m3, 'name', '乾燥機',       'amount',  8400,
        'denominations', '{"10":0,"50":0,"100":40,"500":8, "1000":0}'::jsonb)
    ),
    v_user_id
  );
  INSERT INTO public.collect_funds (laundry_id, collected_at, total_funds, funds_array, collector_id)
  VALUES (
    v_store2_id, v_cf_at + interval '1 day', 29500,
    jsonb_build_array(
      jsonb_build_object('machine_id', v_m4, 'name', '洗濯機', 'amount', 18000,
        'denominations', '{"10":0,"50":0,"100":30,"500":18,"1000":3}'::jsonb),
      jsonb_build_object('machine_id', v_m5, 'name', '乾燥機', 'amount', 11500,
        'denominations', '{"10":0,"50":0,"100":15,"500":19,"1000":2}'::jsonb)
    ),
    v_user_id
  );

  -- 1 month ago
  v_cf_at := date_trunc('month', now() AT TIME ZONE 'Asia/Tokyo')
               AT TIME ZONE 'Asia/Tokyo' - interval '1 month' + interval '5 days';
  INSERT INTO public.collect_funds (laundry_id, collected_at, total_funds, funds_array, collector_id)
  VALUES (
    v_store1_id, v_cf_at, 42600,
    jsonb_build_array(
      jsonb_build_object('machine_id', v_m1, 'name', '洗濯機（大）', 'amount', 21000,
        'denominations', '{"10":0,"50":0,"100":10,"500":32,"1000":8}'::jsonb),
      jsonb_build_object('machine_id', v_m2, 'name', '洗濯機（小）', 'amount', 13600,
        'denominations', '{"10":0,"50":0,"100":36,"500":16,"1000":2}'::jsonb),
      jsonb_build_object('machine_id', v_m3, 'name', '乾燥機',       'amount',  8000,
        'denominations', '{"10":0,"50":0,"100":0, "500":16,"1000":0}'::jsonb)
    ),
    v_user_id
  );
  INSERT INTO public.collect_funds (laundry_id, collected_at, total_funds, funds_array, collector_id)
  VALUES (
    v_store2_id, v_cf_at + interval '2 days', 33200,
    jsonb_build_array(
      jsonb_build_object('machine_id', v_m4, 'name', '洗濯機', 'amount', 20400,
        'denominations', '{"10":0,"50":0,"100":8, "500":32,"1000":4}'::jsonb),
      jsonb_build_object('machine_id', v_m5, 'name', '乾燥機', 'amount', 12800,
        'denominations', '{"10":0,"50":0,"100":6, "500":21,"1000":1}'::jsonb)
    ),
    v_user_id
  );

  -- This month
  v_cf_at := date_trunc('month', now() AT TIME ZONE 'Asia/Tokyo')
               AT TIME ZONE 'Asia/Tokyo' + interval '4 days';
  INSERT INTO public.collect_funds (laundry_id, collected_at, total_funds, funds_array, collector_id)
  VALUES (
    v_store1_id, v_cf_at, 19800,
    jsonb_build_array(
      jsonb_build_object('machine_id', v_m1, 'name', '洗濯機（大）', 'amount', 10200,
        'denominations', '{"10":0,"50":0,"100":2, "500":16,"1000":2}'::jsonb),
      jsonb_build_object('machine_id', v_m2, 'name', '洗濯機（小）', 'amount',  6600,
        'denominations', '{"10":0,"50":0,"100":6, "500":9, "1000":1}'::jsonb),
      jsonb_build_object('machine_id', v_m3, 'name', '乾燥機',       'amount',  3000,
        'denominations', '{"10":0,"50":0,"100":0, "500":6, "1000":0}'::jsonb)
    ),
    v_user_id
  );
  INSERT INTO public.collect_funds (laundry_id, collected_at, total_funds, funds_array, collector_id)
  VALUES (
    v_store2_id, v_cf_at + interval '1 day', 15500,
    jsonb_build_array(
      jsonb_build_object('machine_id', v_m4, 'name', '洗濯機', 'amount',  9500,
        'denominations', '{"10":0,"50":0,"100":0, "500":15,"1000":2}'::jsonb),
      jsonb_build_object('machine_id', v_m5, 'name', '乾燥機', 'amount',  6000,
        'denominations', '{"10":0,"50":0,"100":0, "500":12,"1000":0}'::jsonb)
    ),
    v_user_id
  );

  -- ----------------------------------------------------------------
  -- 9. Action messages
  -- ----------------------------------------------------------------
  INSERT INTO public.action_message (org_id, actor_id, message, occurred_at)
  VALUES
    (v_org_id, v_user_id, '渋谷店 乾燥機 を故障中にしました',           now() - interval '3 days'),
    (v_org_id, v_user_id, '渋谷店 集金を記録しました（¥19,800）',       now() - interval '1 day'),
    (v_org_id, v_user_id, '新宿店 集金を記録しました（¥15,500）',       now() - interval '12 hours'),
    (v_org_id, v_user_id, '新宿店 在庫「柔軟剤」を 0本 に更新しました', now() - interval '6 hours');

  RAISE NOTICE 'サンプルデータの挿入が完了しました。org_id: %', v_org_id;

END $$;
