# 店舗詳細ページ — 集金・売上ナビゲーションボタン設計

## 概要

店舗詳細ページから、その店舗の集金記録ページと売上（アナリティクス）ページへ直接遷移できるナビゲーションボタンを追加する。

## 変更対象

1. `src/app/dashboard/stores/[id]/page.tsx` — ボタン追加
2. `src/app/dashboard/analytics/page.tsx` — 店舗フィルター対応

---

## 1. 店舗詳細ページのボタン追加

### 配置

店舗名カード（`bg-canvas rounded-lg border border-hairline p-6 mb-6`）の直下、統計グリッドの上に2ボタンを横並びで挿入する。

### ボタン定義

| ラベル | アイコン | 遷移先 |
|--------|----------|--------|
| 集金記録を見る | `Wallet` | `/dashboard/stores/{id}/collect` |
| 売上を確認 | `BarChart3` | `/dashboard/analytics?store={id}` |

### スタイル

既存の「機器管理」「在庫管理」リンクと同じアウトラインボタン：
```
inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
text-ink-mute bg-canvas-soft hover:bg-canvas border border-hairline rounded-sm transition
```

---

## 2. アナリティクスページの店舗フィルター

### searchParams の追加

```typescript
interface PageProps {
  searchParams: Promise<{
    period?: string
    from?: string
    to?: string
    store?: string  // 追加
  }>
}
```

### データフェッチの変更

`store` パラメーターが存在する場合：
- `laundry_store` テーブルから `id = store` の店舗名を取得（`single()`）
- `records` クエリに `.eq('laundry_id', store)` を追加
- `prevRecords` クエリにも同様のフィルターを追加

`store` パラメーターが存在しない場合：既存の挙動を維持（全店舗）。

### UI の変更

`store` パラメーターがある場合、ページ上部（`PeriodSelector` の上）に店舗フィルターバナーを表示する：

```
┌──────────────────────────────────────────┐
│ 📍 ○○店 の売上を表示中   全店舗に戻る →  │
└──────────────────────────────────────────┘
```

- 「全店舗に戻る」は `/dashboard/analytics` へのリンク（period/from/to パラメーターは引き継がない）
- バナースタイル：`bg-canvas-soft border border-hairline rounded-lg px-4 py-3`

### 非表示・変更なし

- `StoreComparisonChart` は店舗フィルター時も引き続き表示（1店舗のみ表示されるため自然に機能する）
- `PeriodSelector` は変更なし（期間フィルターは引き続き機能する）

---

## 制約・注意事項

- `store` パラメーターに存在しない店舗IDが渡された場合、バナーには店舗名が表示されないため、クエリ結果が `null` になる。その場合はバナーを表示せず、データを全件表示するフォールバックは行わない（空の結果をそのまま表示）。
- アナリティクスページ内での店舗切り替えUIは追加しない（URLパラメーター制御のみ）。
