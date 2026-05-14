@AGENTS.md

# Collecie — 開発ガイド

コインランドリー向け集金・在庫・機器管理 SaaS。組織（オーナー）が複数店舗と複数メンバーを管理する。

---

## 技術スタック

| 役割 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js App Router | 16.2.6 |
| UI ライブラリ | React | 19.2.4 |
| スタイリング | Tailwind CSS | v4 |
| アイコン | lucide-react | 1.14.0 |
| チャート | recharts | 3.x |
| BaaS | Supabase (PostgreSQL + Auth + Storage + RLS) | — |
| 認証 SSR | @supabase/ssr | 0.10.x |
| デプロイ予定 | Vercel | — |

> **Tailwind CSS v4 は v3 と破壊的変更あり。** `@apply` の挙動や設定ファイルの形式が異なる。コンポーネント作成前に `node_modules/tailwindcss/` 配下のドキュメントを確認すること。

---

## ディレクトリ構造

```
src/
├── app/
│   ├── auth/              # ログイン・登録・パスワードリセット・招待受諾
│   ├── setup/             # 初回プロフィール登録（役割・組織作成）
│   └── dashboard/
│       ├── layout.tsx     # サイドバー共通レイアウト
│       ├── page.tsx       # ダッシュボード（故障アラート・低在庫アラート・ログ）
│       ├── stores/        # 店舗一覧・詳細・編集・機器管理・在庫
│       ├── collect/       # 集金記録一覧・詳細・新規・編集
│       ├── inventory/     # 在庫種別管理（admin）
│       ├── members/       # メンバー管理・招待（admin）
│       ├── analytics/     # 売上グラフ（未実装）
│       ├── logs/          # アクションログ
│       └── profile/       # プロフィール設定
├── components/
│   ├── machines/          # MachineList, AddMachineForm
│   └── stores/            # StoreForm, DeleteStoreButton
├── lib/
│   ├── auth.ts            # getCurrentUserWithOrg() — 全ページで使う認証ヘルパー
│   ├── analytics.ts       # 集計ロジック
│   ├── utils.ts           # formatAmount, formatDateJST
│   └── supabase/          # client.ts / server.ts / index.ts
└── types/
    └── database.ts        # 全テーブルの Row / Insert / Update 型 + FundsItem
```

**Server Actions の配置ルール:** 各機能の直下に `actions.ts` を置く。ページや components 内に DB 操作を直書きしない。

---

## アーキテクチャ原則

- **React Server Components をデフォルト**とする。`useState` / `useEffect` / イベントハンドラが必要な箇所のみ `"use client"` を付与する
- **データフェッチは Server Component** で行い、結果を props として Client Component に渡す
- **DB 操作はすべて Server Actions** に集約する（`actions.ts`）
- **日付は `timestamptz`（UTC）** で保持し、表示時のみ `formatDateJST()` で JST 変換する
- **金額は円単位の `bigint`** で統一し、変換ロジックを持たない
- **エラーメッセージ・UI テキストはすべて日本語**で統一する
- **コードコメントは原則書かない**

---

## 権限モデル

| 操作 | admin | collecter | viewer |
|------|:-----:|:---------:|:------:|
| 店舗作成・編集・削除 | ✓ | — | — |
| 機器追加・削除 | ✓ | — | — |
| 機器状態更新（故障フラグ） | ✓ | ✓ | — |
| 集金記録（自分のみ編集・削除） | ✓ | ✓ | — |
| 集金記録（全員分編集・削除） | ✓ | — | — |
| 在庫数更新 | ✓ | ✓ | — |
| 在庫種別追加・削除 | ✓ | — | — |
| メンバー管理・招待 | ✓ | — | — |
| 閲覧全般 | ✓ | ✓ | ✓ |

権限チェックは Server Action 内で `profile.role` を確認する。RLS はセカンダリの保護として機能する。

---

## データベース

### テーブル構成

| テーブル | 概要 |
|----------|------|
| `profiles` | ユーザー情報・設定（role, collect_method, track_denominations 等） |
| `organizations` | 組織マスタ（owner_id あり） |
| `organization_members` | 組織メンバー（RLS の中心テーブル） |
| `organization_invitations` | 招待トークン（7日有効） |
| `laundry_store` | 店舗マスタ |
| `machines` | 機器定義＋状態（is_broken, comment） |
| `inventory_types` | 在庫種別マスタ（組織ごとにカスタム可） |
| `laundry_inventory` | 店舗×種別の在庫数量（交差テーブル） |
| `collect_funds` | 集金記録（funds_array は JSONB） |
| `action_message` | 操作ログ |

### NOT NULL カラムの注意

`laundry_store` の `location` と `description` は `NOT NULL`。フォームから `null` を渡すと `23502` エラーになる。空文字 `''` を渡すこと。

```typescript
// NG
const description = (formData.get('description') as string) || null

// OK
const description = (formData.get('description') as string) ?? ''
```

### collect_funds.collector_id の join

`collector_id` の外部キーは `auth.users(id)` を参照しており、`profiles` への直接 FK は存在しない。PostgREST で `profiles` に join しようとすると失敗する。**プロフィール情報は別クエリで取得**してマージする。

```typescript
// NG: FK が auth.users を指しているため動作しない
.select('*, collector:profiles!collect_funds_collector_id_fkey(id, full_name)')

// OK: 別クエリで profiles を取得してマージ
const { data: rawData } = await supabase.from('collect_funds').select('*')
const ids = [...new Set(rawData.map(r => r.collector_id))]
const { data: profiles } = await supabase.from('profiles').select('id, full_name, username').in('id', ids)
```

### funds_array の構造

```jsonc
// track_denominations = false
[{ "machine_id": "uuid", "name": "洗濯機1", "amount": 5400 }]

// track_denominations = true
[{ "machine_id": "uuid", "name": "洗濯機1", "amount": 5400,
   "denominations": { "10": 0, "50": 2, "100": 30, "500": 6, "1000": 1 } }]
// 1円・5円は除外。amount は denominations の合計と一致させる
```

---

## RLS（Row Level Security）

### SECURITY DEFINER 関数（必須）

`organization_members` の SELECT ポリシーが自テーブルを参照すると無限再帰が発生する。これを防ぐため、以下の関数を Supabase に作成・維持する必要がある。**新しい Supabase プロジェクトには `002_rls.sql` を最初に適用する。**

```sql
-- 再帰を防ぐ SECURITY DEFINER 関数（002_rls.sql に定義済み）
public.is_member_of(p_org_id uuid)
public.is_admin_of(p_org_id uuid)
public.is_admin_or_collecter_of(p_org_id uuid)
public.shares_org_with_current_user(p_user_id uuid)  -- 同組織メンバーのプロフィール閲覧用
```

これらが未適用の場合、ダッシュボード・店舗登録・集金記録など**すべての機能が正常動作しない**。

### SQL マイグレーション管理

Supabase CLI は使用せず、**Supabase SQL Editor から手動実行**する。

| ファイル | 内容 | 実行順 |
|---------|------|--------|
| `supabase/migrations/001_tables.sql` | テーブル・トリガー作成 | 1 |
| `supabase/migrations/002_rls.sql` | RLS 有効化・SECURITY DEFINER 関数・ポリシー | 2 |
| `supabase/migrations/003_storage.sql` | Storage バケット設定 | 3 |
| `supabase/migrations/004_seed.sql` | 開発用サンプルデータ | 任意 |

migration ファイルはドキュメントとして管理する。Supabase に変更を加えたら対応する migration ファイルも更新する。

### Service Role Key

`SUPABASE_SERVICE_ROLE_KEY` は RLS をバイパスする。認証ユーザーが存在しない処理（Webhook 等）以外では使用しない。現在はメンバーのメールアドレス表示のみ使用を許可している。

---

## 認証ヘルパー

`src/lib/auth.ts` の `getCurrentUserWithOrg()` はほぼすべてのページ・Server Action で使う。

```typescript
// 戻り値
{ user, profile, membership }
// membership が null の場合 = 組織未所属（通常は起きない）
// profile.role が null の場合 = /setup 未完了 → redirect('/setup') される
```

---

## Storage

| バケット | パス | 用途 |
|---------|------|------|
| `laundry-images` | `laundry/{filename}` | 店舗写真 |

画像アップロードは Client Component（`StoreForm.tsx`）で Supabase Storage SDK を直接呼ぶ。URL を state に保持し、フォーム送信時に JSON として Server Action に渡す。

---

## 未実装・今後実装予定の機能

- **アナリティクス・売上グラフ** (`/dashboard/analytics`) — Recharts で月別・店舗別集計。`src/lib/analytics.ts` に集計ロジックの骨格あり
- **在庫種別の追加・削除** (`/dashboard/inventory`) — admin が `inventory_types` を CRUD。種別追加時は既存全店舗の `laundry_inventory` に quantity=0 で自動追加
- **メンバー招待・管理の改善** (`/dashboard/members`) — 招待メール送信、役割変更 UI の整備
- **プッシュ通知・メール通知** — 故障アラート・低在庫アラートの通知（手段未定）

---

## 開発コマンド

```bash
npm run dev    # 開発サーバー起動（http://localhost:3000）
npm run build  # 本番ビルド（デプロイ前に必ず確認）
npm run lint   # ESLint
```
