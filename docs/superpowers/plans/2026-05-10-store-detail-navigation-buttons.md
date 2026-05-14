# 店舗詳細ナビゲーションボタン実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 店舗詳細ページから集金履歴・売上ページへ遷移するボタンを追加し、アナリティクスページに店舗フィルター機能を追加する。

**Architecture:** 店舗詳細ページに2つの `Link` ボタンを挿入する。アナリティクスページは `?store=<id>` クエリパラメーターを受け取り、店舗フィルターを適用してデータを絞り込む。フィルター時はバナーで現在の店舗名を表示し、全店舗表示に戻るリンクを提供する。

**Tech Stack:** Next.js App Router (Server Component), Tailwind CSS v4, lucide-react, Supabase

---

### Task 1: 店舗詳細ページにナビゲーションボタンを追加

**Files:**
- Modify: `src/app/dashboard/stores/[id]/page.tsx`

- [ ] **Step 1: lucide-react のインポートに `Wallet` と `BarChart3` を追加する**

`src/app/dashboard/stores/[id]/page.tsx` の3行目を以下に差し替える：

```typescript
import { MapPin, Pencil, Plus, Wrench, WashingMachine, Package, Wallet, BarChart3 } from 'lucide-react'
```

- [ ] **Step 2: 店舗カードと統計グリッドの間にナビゲーションボタンブロックを挿入する**

104行目の `</div>` (店舗カード終了) の直後、105行目の `<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">` の直前に以下を挿入する：

```tsx
      <div className="flex gap-3 mb-6">
        <Link
          href={`/dashboard/stores/${id}/collect`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-ink bg-canvas border border-hairline hover:bg-canvas-soft rounded-sm transition"
        >
          <Wallet className="h-4 w-4 text-primary" />
          集金記録を見る
        </Link>
        <Link
          href={`/dashboard/analytics?store=${id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-ink bg-canvas border border-hairline hover:bg-canvas-soft rounded-sm transition"
        >
          <BarChart3 className="h-4 w-4 text-primary" />
          売上を確認
        </Link>
      </div>
```

- [ ] **Step 3: lint を確認する**

```bash
npm run lint
```

エラーがないことを確認する。

- [ ] **Step 4: コミットする**

```bash
git add src/app/dashboard/stores/[id]/page.tsx
git commit -m "feat: 店舗詳細ページに集金・売上ナビゲーションボタンを追加"
```

---

### Task 2: アナリティクスページに店舗フィルター機能を追加

**Files:**
- Modify: `src/app/dashboard/analytics/page.tsx`

- [ ] **Step 1: `Link` のインポートと `MapPin` アイコンのインポートを追加する**

`src/app/dashboard/analytics/page.tsx` の先頭に `Link` と `MapPin` を追加する：

```typescript
import Link from 'next/link'
import { BarChart3, TrendingUp, Store, ArrowUpDown, MapPin } from 'lucide-react'
```

- [ ] **Step 2: `searchParams` インターフェースに `store` を追加する**

```typescript
interface PageProps {
  searchParams: Promise<{
    period?: string
    from?: string
    to?: string
    store?: string
  }>
}
```

- [ ] **Step 3: `params` から `store` を取り出すコードを追加する**

`const { membership } = await getCurrentUserWithOrg()` の後の行で `store` を取り出す：

```typescript
  const defaults = getDefaultPeriod()
  const period = params.period ?? defaults.period
  const from = params.from ?? defaults.from
  const to = params.to ?? defaults.to
  const storeFilter = params.store ?? null
```

- [ ] **Step 4: データフェッチロジックを店舗フィルター対応に書き換える**

現在の `if (membership?.org_id) { ... }` ブロック（54〜95行目）を以下に差し替える：

```typescript
  if (membership?.org_id) {
    if (storeFilter) {
      const { data: storeRow } = await supabase
        .from('laundry_store')
        .select('*')
        .eq('id', storeFilter)
        .single()
      if (storeRow) stores = [storeRow]
    } else {
      const { data: storeData } = await supabase
        .from('laundry_store')
        .select('*')
        .eq('organization_id', membership.org_id)
        .order('name', { ascending: true })
      stores = storeData ?? []
    }

    if (stores.length > 0) {
      const fromUTC = new Date(from + 'T00:00:00+09:00').toISOString()
      const toUTC = new Date(to + 'T23:59:59+09:00').toISOString()

      let currentQuery = supabase
        .from('collect_funds')
        .select('*')
        .gte('collected_at', fromUTC)
        .lte('collected_at', toUTC)
        .order('collected_at', { ascending: true })

      if (storeFilter) {
        currentQuery = currentQuery.eq('laundry_id', storeFilter)
      } else {
        currentQuery = currentQuery.in('laundry_id', stores.map((s) => s.id))
      }

      const { data: currentData } = await currentQuery
      records = currentData ?? []

      const periodLengthMs =
        new Date(toUTC).getTime() - new Date(fromUTC).getTime()
      const prevToUTC = new Date(new Date(fromUTC).getTime() - 1).toISOString()
      const prevFromUTC = new Date(
        new Date(fromUTC).getTime() - periodLengthMs - 1
      ).toISOString()

      let prevQuery = supabase
        .from('collect_funds')
        .select('*')
        .gte('collected_at', prevFromUTC)
        .lte('collected_at', prevToUTC)

      if (storeFilter) {
        prevQuery = prevQuery.eq('laundry_id', storeFilter)
      } else {
        prevQuery = prevQuery.in('laundry_id', stores.map((s) => s.id))
      }

      const { data: prevData } = await prevQuery
      prevRecords = prevData ?? []
    }
  }
```

- [ ] **Step 5: `filteredStore` 変数を集計の前に定義する**

`// Aggregate data` コメントの直前に追加する：

```typescript
  const filteredStore = storeFilter ? (stores[0] ?? null) : null
```

- [ ] **Step 6: 店舗フィルターバナーを追加する**

`return (` 内の `{/* Period Selector */}` ブロックの直前に以下を挿入する：

```tsx
      {/* Store filter banner */}
      {filteredStore && (
        <div className="bg-canvas-soft border border-hairline rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-medium text-ink">{filteredStore.name}</span>
            <span className="text-ink-mute">の売上を表示中</span>
          </div>
          <Link
            href="/dashboard/analytics"
            className="text-sm text-ink-mute hover:text-ink transition"
          >
            全店舗に戻る →
          </Link>
        </div>
      )}
```

- [ ] **Step 7: lint を確認する**

```bash
npm run lint
```

エラーがないことを確認する。

- [ ] **Step 8: コミットする**

```bash
git add src/app/dashboard/analytics/page.tsx
git commit -m "feat: アナリティクスページに店舗フィルター機能を追加（?store=<id>）"
```
