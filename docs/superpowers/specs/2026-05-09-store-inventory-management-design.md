# 店舗別在庫管理ページ — 設計書

Date: 2026-05-09

## 概要

各店舗に機器管理ページ（`/dashboard/stores/[id]/machines`）と同様に、在庫数をインラインで更新できる在庫管理ページを整備する。

既存の `stores/[id]/inventory/page.tsx` は閲覧のみで、編集は全店舗マトリクス（`/dashboard/inventory`）へのリンクしかなかった。このページをインライン編集対応に強化する。

---

## 変更箇所（3ファイル）

### 1. 新規: `src/components/inventory/StoreInventoryEditor.tsx`

`'use client'` の Client Component。

- **表示**: グリッド2列のカード形式。各カードに在庫種別名・単位・現在数量・低在庫バッジを表示
- **編集**: +/− ボタンと数値入力で数量を変更（0以下は不可）
- **バッジ**: `quantity === 0` → 在庫切れ（赤）、`quantity < alert_threshold` → 在庫少（amber）
- **保存**: 変更があるときのみ一括保存ボタンを有効化。`bulkUpdateInventoryAction` を呼ぶ
- **権限**: `canEdit=false` のとき数量表示のみ（+/−ボタン・入力無効化）
- **状態**: 保存中はローダー表示、保存完了は成功メッセージ、エラーはエラーメッセージ

Props:
```ts
interface Props {
  inventory: InventoryWithType[]
  canEdit: boolean
}
```

### 2. 更新: `src/app/dashboard/stores/[id]/inventory/page.tsx`

- 現在の手書き閲覧ビュー（`div` のリスト）を `<StoreInventoryEditor>` に置き換え
- `canEdit` を props として渡す
- 低在庫警告バナーはページ側に残す（Server Component での表示）
- 「全店舗の在庫マトリクスを見る」リンクは残す

### 3. 更新: `src/app/dashboard/stores/[id]/page.tsx`

在庫セクションのヘッダーに「在庫管理」リンクを追加。

```tsx
<Link href={`/dashboard/stores/${id}/inventory`}>
  <Package className="h-3.5 w-3.5" />
  在庫管理
</Link>
```

機器管理リンク（`bg-indigo-50 text-indigo-600`）と同じスタイルで統一。

---

## データフロー

```
StoreInventoryPage (Server Component)
  └─ supabase.from('laundry_inventory').select('*, inventory_types(*)')
  └─ <StoreInventoryEditor inventory={...} canEdit={canEdit} />
       └─ bulkUpdateInventoryAction(updates)  ← 既存の actions.ts を再利用
```

`bulkUpdateInventoryAction` は `/dashboard/inventory/actions.ts` に定義済み。新しい actions.ts は不要。

---

## 権限

| ロール | 表示 | 編集 |
|--------|:----:|:----:|
| admin | ✓ | ✓ |
| collecter | ✓ | ✓ |
| viewer | ✓ | — |

---

## 非対象

- 在庫種別の追加・削除（`/dashboard/inventory` の admin 機能）
- 在庫種別が0件のときの追加 UI（既存の「在庫種別を管理する」リンクで対応済み）
