# 店舗別在庫管理ページ 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 各店舗の在庫管理ページ (`/dashboard/stores/[id]/inventory`) でインライン編集（+/−ボタン＋一括保存）を可能にし、店舗詳細ページから遷移できるようにする。

**Architecture:** 新規 Client Component `StoreInventoryEditor` を作成し、既存の `bulkUpdateInventoryAction` を再利用する。店舗詳細ページに「在庫管理」リンクを追加。既存の inventory ページを読み取り専用から編集対応に置き換える。

**Tech Stack:** Next.js App Router, React 19 (useTransition), Tailwind CSS v4, lucide-react, Supabase

---

## ファイル構成

| 操作 | ファイル |
|------|---------|
| 新規作成 | `src/components/inventory/StoreInventoryEditor.tsx` |
| 修正 | `src/app/dashboard/stores/[id]/inventory/page.tsx` |
| 修正 | `src/app/dashboard/stores/[id]/page.tsx` |

---

## Task 1: StoreInventoryEditor コンポーネントを作成する

**Files:**
- Create: `src/components/inventory/StoreInventoryEditor.tsx`

### 型定義と骨格

- [ ] **Step 1: ファイルを作成し、型定義と骨格を書く**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Minus, Plus, Save, CheckCircle, Loader2, Package } from 'lucide-react'
import { bulkUpdateInventoryAction } from '@/app/dashboard/inventory/actions'
import type { InventoryType, LaundryInventory } from '@/types/database'

interface InventoryWithType extends LaundryInventory {
  inventory_types: InventoryType | null
}

interface Props {
  inventory: InventoryWithType[]
  canEdit: boolean
}

export default function StoreInventoryEditor({ inventory, canEdit }: Props) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const inv of inventory) {
      init[inv.id] = inv.quantity
    }
    return init
  })

  const [savedValues, setSavedValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const inv of inventory) {
      init[inv.id] = inv.quantity
    }
    return init
  })

  const [isSaving, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const dirtyIds = Object.keys(values).filter((id) => values[id] !== savedValues[id])
  const isDirty = dirtyIds.length > 0

  function handleChange(inventoryId: string, newValue: number) {
    if (newValue < 0) return
    setSaveSuccess(false)
    setValues((prev) => ({ ...prev, [inventoryId]: newValue }))
  }

  function handleSave() {
    if (!isDirty || isSaving) return
    setSaveError(null)
    setSaveSuccess(false)

    const updates = dirtyIds.map((id) => ({ inventoryId: id, quantity: values[id] }))

    startTransition(async () => {
      const result = await bulkUpdateInventoryAction(updates)
      if (result.error) {
        setSaveError(result.error)
      } else {
        setSavedValues((prev) => {
          const next = { ...prev }
          updates.forEach(({ inventoryId, quantity }) => {
            next[inventoryId] = quantity
          })
          return next
        })
        setSaveSuccess(true)
      }
    })
  }

  if (inventory.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <Package className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">在庫種別が登録されていません。</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 rounded-t-xl overflow-hidden">
        {inventory.map((inv) => {
          const type = inv.inventory_types
          const threshold = type?.alert_threshold ?? 2
          const currentValue = values[inv.id] ?? inv.quantity
          const isCritical = currentValue === 0
          const isLow = currentValue < threshold
          const isDirtyCell = currentValue !== savedValues[inv.id]

          return (
            <div
              key={inv.id}
              className={`p-4 flex items-center justify-between gap-4 bg-white ${
                isCritical ? 'bg-red-50' : isLow ? 'bg-amber-50' : ''
              }`}
            >
              {/* Left: name + badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {type?.name ?? '不明'}
                  </span>
                  {isCritical && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      在庫切れ
                    </span>
                  )}
                  {!isCritical && isLow && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      在庫少
                    </span>
                  )}
                  {isDirtyCell && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                      変更中
                    </span>
                  )}
                </div>
                {type?.unit && (
                  <span className="text-xs text-gray-400">{type.unit}</span>
                )}
              </div>

              {/* Right: quantity controls */}
              {canEdit ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleChange(inv.id, currentValue - 1)}
                    disabled={currentValue <= 0 || isSaving}
                    className="h-8 w-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    aria-label="減らす"
                  >
                    <Minus className="h-3.5 w-3.5 text-gray-600" />
                  </button>

                  <input
                    type="number"
                    min={0}
                    value={currentValue}
                    onChange={(e) => handleChange(inv.id, parseInt(e.target.value, 10) || 0)}
                    disabled={isSaving}
                    className={`w-14 text-center text-base font-bold rounded-lg border py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 ${
                      isCritical
                        ? 'border-red-300 text-red-700 bg-red-50'
                        : isLow
                        ? 'border-amber-300 text-amber-700 bg-amber-50'
                        : isDirtyCell
                        ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                        : 'border-gray-200 text-gray-900 bg-white'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => handleChange(inv.id, currentValue + 1)}
                    disabled={isSaving}
                    className="h-8 w-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    aria-label="増やす"
                  >
                    <Plus className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <span
                  className={`text-xl font-bold flex-shrink-0 ${
                    isCritical
                      ? 'text-red-600'
                      : isLow
                      ? 'text-amber-600'
                      : 'text-gray-900'
                  }`}
                >
                  {currentValue}
                  {type?.unit && (
                    <span className="text-sm font-normal text-gray-500 ml-1">{type.unit}</span>
                  )}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Save bar */}
      {canEdit && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-gray-500">
            {isDirty ? (
              <span className="text-indigo-600 font-medium">{dirtyIds.length}件の変更があります</span>
            ) : (
              <span>変更なし</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                更新しました
              </span>
            )}
            {saveError && (
              <span className="text-xs text-red-600">{saveError}</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? '更新中...' : '在庫を更新する'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: ビルドエラーがないか確認する**

```powershell
cd "C:\Users\貸出アカウント\code-factory\dev\coinlaundy_app"
npm run build 2>&1 | Select-String -Pattern "error|Error" | head -20
```

エラーがなければ OK。型エラーがあれば修正する。

- [ ] **Step 3: コミット**

```powershell
git add src/components/inventory/StoreInventoryEditor.tsx
git commit -m "feat: StoreInventoryEditor コンポーネントを追加"
```

---

## Task 2: 店舗別在庫ページを StoreInventoryEditor に置き換える

**Files:**
- Modify: `src/app/dashboard/stores/[id]/inventory/page.tsx`

### 現在のページ

現在のページは読み取り専用で、`div` のリストに在庫を表示している。低在庫警告バナーはサーバーサイドで計算済み。

- [ ] **Step 1: `inventory/page.tsx` を書き換える**

`src/app/dashboard/stores/[id]/inventory/page.tsx` の内容を以下に全置換：

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, AlertTriangle, ChevronLeft } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import StoreInventoryEditor from '@/components/inventory/StoreInventoryEditor'
import type { InventoryType, LaundryStore, LaundryInventory } from '@/types/database'

interface InventoryWithType extends LaundryInventory {
  inventory_types: InventoryType | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StoreInventoryPage({ params }: PageProps) {
  const { id } = await params
  const { profile } = await getCurrentUserWithOrg()
  const isAdmin = profile.role === 'admin'
  const canEdit = isAdmin || profile.role === 'collecter'

  const supabase = await createClient()

  const { data: store } = await supabase
    .from('laundry_store')
    .select('*')
    .eq('id', id)
    .single()

  if (!store) notFound()

  const { data: inventoryData } = await supabase
    .from('laundry_inventory')
    .select('*, inventory_types(*)')
    .eq('laundry_id', id)
    .order('created_at', { ascending: true })

  const inventory: InventoryWithType[] = (inventoryData ?? []) as InventoryWithType[]

  const lowStockItems = inventory.filter((inv) => {
    const threshold = inv.inventory_types?.alert_threshold ?? 2
    return inv.quantity < threshold
  })

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link
        href={`/dashboard/stores/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {(store as LaundryStore).name} に戻る
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-teal-50 p-2.5 rounded-xl">
          <Package className="h-6 w-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">在庫管理</h1>
          <p className="text-sm text-gray-500">{(store as LaundryStore).name}</p>
        </div>
      </div>

      {/* Low stock warning */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-800">
              在庫不足 {lowStockItems.length}件
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((inv) => (
              <span
                key={inv.id}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  inv.quantity === 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {inv.inventory_types?.name ?? '不明'}: {inv.quantity}
                {inv.inventory_types?.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory editor */}
      <div className="mb-6">
        <StoreInventoryEditor inventory={inventory} canEdit={canEdit} />
      </div>

      {/* Admin: link to inventory type management */}
      {isAdmin && inventory.length === 0 && (
        <div className="text-center mt-2">
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:underline"
          >
            在庫種別を管理する
          </Link>
        </div>
      )}

      {/* Link to global inventory */}
      <div className="mt-4">
        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
        >
          <Package className="h-4 w-4" />
          全店舗の在庫マトリクスを見る
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: ビルドエラーがないか確認する**

```powershell
cd "C:\Users\貸出アカウント\code-factory\dev\coinlaundy_app"
npm run build 2>&1 | Select-String -Pattern "error|Error" | head -20
```

- [ ] **Step 3: コミット**

```powershell
git add src/app/dashboard/stores/[id]/inventory/page.tsx
git commit -m "feat: 店舗別在庫ページをインライン編集対応に更新"
```

---

## Task 3: 店舗詳細ページに「在庫管理」リンクを追加する

**Files:**
- Modify: `src/app/dashboard/stores/[id]/page.tsx`

### 現在の状態

店舗詳細ページの在庫セクション（l.196〜213）には「在庫管理」ボタンがなく、機器管理のみリンクがある。機器管理リンク（l.150〜157）のスタイルを踏襲して追加する。

- [ ] **Step 1: 在庫セクションのヘッダーに「在庫管理」リンクを追加する**

`src/app/dashboard/stores/[id]/page.tsx` の在庫セクションのヘッダー部分を修正する。

変更前（l.197〜199）：
```tsx
      {inventoryList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">在庫サマリー</h2>
```

変更後：
```tsx
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">在庫</h2>
          <Link
            href={`/dashboard/stores/${id}/inventory`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
          >
            <Package className="h-3.5 w-3.5" />
            在庫管理
          </Link>
        </div>
```

また、元の `{inventoryList.length > 0 && (` の条件と末尾の `)}` を調整して在庫0件でもカードを表示するようにする。在庫0件のときは「在庫種別が登録されていません」メッセージを表示する。

完成後の在庫セクション全体（l.196〜213 相当）：

```tsx
      {/* Inventory section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">在庫</h2>
          <Link
            href={`/dashboard/stores/${id}/inventory`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
          >
            <Package className="h-3.5 w-3.5" />
            在庫管理
          </Link>
        </div>
        {inventoryList.length === 0 ? (
          <p className="text-sm text-gray-400">在庫種別が登録されていません。</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {inventoryList.map((inv) => (
              <div key={inv.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">{inv.inventory_types?.name ?? '不明'}</p>
                <p className="text-lg font-bold text-gray-900">
                  {inv.quantity}
                  {inv.inventory_types?.unit && (
                    <span className="text-sm font-normal text-gray-500 ml-1">{inv.inventory_types.unit}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
```

- [ ] **Step 2: ビルドエラーがないか確認する**

```powershell
cd "C:\Users\貸出アカウント\code-factory\dev\coinlaundy_app"
npm run build 2>&1 | Select-String -Pattern "error|Error" | head -20
```

TypeScript エラーがあれば修正する。

- [ ] **Step 3: コミット**

```powershell
git add "src/app/dashboard/stores/[id]/page.tsx"
git commit -m "feat: 店舗詳細ページに在庫管理リンクを追加"
```

---

## Task 4: 動作確認

- [ ] **Step 1: 開発サーバーを起動する**

```powershell
cd "C:\Users\貸出アカウント\code-factory\dev\coinlaundy_app"
npm run dev
```

- [ ] **Step 2: 動作確認チェックリスト**

ブラウザで `http://localhost:3000` を開き、以下を確認する：

1. **店舗詳細ページ** (`/dashboard/stores/[id]`) に「在庫管理」ボタンが表示される
2. ボタンを押すと `/dashboard/stores/[id]/inventory` に遷移する
3. 在庫ページに +/− ボタンと数値入力が表示される
4. 数値を変更すると「変更中」バッジが表示される
5. 「在庫を更新する」ボタンを押すと保存され「更新しました」メッセージが出る
6. viewer ロールのユーザーは +/− なしの読み取りのみ表示になる（`canEdit=false`）
7. 在庫0件の店舗でも「在庫種別が登録されていません」と表示される
