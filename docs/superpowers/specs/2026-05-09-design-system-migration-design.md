# Design System Migration — Supabaze Inspired

**Date:** 2026-05-09
**Scope:** アプリ全体（認証ページ・ダッシュボード・全コンポーネント）
**Approach:** トークンファースト（CSS変数 + Tailwind v4 `@theme`）

---

## 概要

現行のIndigoベース配色（`indigo-600/700/900`）をDESIGN.mdで定義された「Supabaze Inspired」デザイン言語に全面移行する。エメラルドグリーン(`#3ecf8e`)を唯一のアクセントカラーとし、白キャンバスと近黒テキストによるモノクロームベースのUIを実現する。フォントもGeist SansからInterに変更する。

---

## セクション1: デザイントークン

### globals.css への追加

`@import "tailwindcss"` の直後に `@theme` ブロックを追加し、全デザイントークンをTailwindユーティリティとして登録する。

```css
@theme {
  /* カラー: ブランド */
  --color-primary: #3ecf8e;
  --color-primary-deep: #24b47e;
  --color-primary-soft: #4ade80;

  /* カラー: テキスト */
  --color-ink: #171717;
  --color-ink-secondary: #212121;
  --color-ink-mute: #707070;
  --color-ink-mute-2: #9a9a9a;
  --color-ink-faint: #b2b2b2;
  --color-on-primary: #171717;
  --color-on-dark: #ffffff;

  /* カラー: サーフェス */
  --color-canvas: #ffffff;
  --color-canvas-soft: #fafafa;
  --color-canvas-night: #1c1c1c;
  --color-canvas-night-soft: #202020;

  /* カラー: ボーダー */
  --color-hairline: #dfdfdf;
  --color-hairline-strong: #c7c7c7;
  --color-hairline-cool: #ededed;

  /* フォント */
  --font-sans: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;

  /* カラー: アクセント（アラートのみ） */
  --color-accent-tomato: #ff2201;
  --color-accent-yellow: #ffdb13;

  /* 角丸 */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

### root layout のフォント変更

`src/app/layout.tsx` で `next/font/google` から Inter を読み込む。weight は `['400', '500']`。Geist Sansの import を削除する。

---

## セクション2: サイドバー

**ファイル:** `src/app/dashboard/DashboardSidebar.tsx`

| 要素 | 現在 | 変更後 |
|---|---|---|
| 背景 | `bg-indigo-900` | `bg-canvas border-r border-hairline` |
| ロゴ/アプリ名 | `text-white` | `text-ink font-medium` |
| ナビ（通常） | `text-indigo-200 hover:bg-indigo-800` | `text-ink-mute hover:text-ink hover:bg-canvas-soft rounded-md` |
| ナビ（アクティブ） | `bg-indigo-700 text-white` | `text-ink bg-canvas-soft rounded-md` + 左ボーダー `border-l-2 border-primary` |
| ユーザーエリア | `border-indigo-800` | `border-t border-hairline` |
| アバター背景 | `bg-indigo-500` | `bg-canvas-soft border border-hairline` + イニシャル `text-ink` |
| ロールバッジ（全役割） | indigo/teal/gray 色分け | `bg-canvas-soft text-ink-mute text-xs rounded-full px-2 py-0.5` に統一 |
| ログアウトボタン | `text-indigo-300 hover:text-white` | `text-ink-mute hover:text-ink` |

---

## セクション3: 認証ページ

**ファイル:** `src/app/auth/layout.tsx`, `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`, `src/app/auth/forgot-password/page.tsx`, `src/app/auth/reset-password/page.tsx`, `src/app/auth/invite/[token]/page.tsx`

| 要素 | 現在 | 変更後 |
|---|---|---|
| layout 背景 | `bg-gradient-to-br from-indigo-50 to-blue-100` | `bg-canvas` |
| ロゴ「Collecie」 | `text-indigo-700 font-bold` | `text-ink font-medium tracking-tight` |
| サブタイトル | `text-gray-600` | `text-ink-mute` |
| カード | `bg-white rounded-2xl shadow-lg` | `bg-canvas border border-hairline rounded-xl shadow-sm` |
| フォーム入力 | `border-gray-300 focus:ring-indigo-500` | `border-hairline rounded-sm focus:border-ink-mute-2 outline-none` |
| プライマリボタン | `bg-indigo-600 text-white hover:bg-indigo-700` | `bg-primary text-on-primary hover:bg-primary-deep rounded-sm` |
| リンク | `text-indigo-600 hover:text-indigo-800` | `text-ink underline hover:text-ink-mute` |
| エラー表示 | `bg-red-50 border-red-200 text-red-700` | `bg-[#fff3f0] border-accent-tomato/30 text-accent-tomato` |

---

## セクション4: ボタン・カード・インプット（共通UI）

### ボタン

| バリアント | クラス |
|---|---|
| プライマリ | `bg-primary text-on-primary hover:bg-primary-deep rounded-sm px-4 py-2 text-sm font-medium` |
| セカンダリ | `bg-canvas text-ink border border-hairline-strong hover:bg-canvas-soft rounded-sm px-4 py-2 text-sm font-medium` |
| 危険 | `bg-canvas text-accent-tomato border border-hairline-strong hover:bg-[#fff3f0] rounded-sm px-4 py-2 text-sm font-medium` |

**重要:** プライマリボタンのテキストは `text-on-primary` = `#171717`（ダーク）。白テキストは禁止。

### カード

```
bg-canvas border border-hairline rounded-lg p-8
```
shadow-lg は廃止。必要な場合は `shadow-sm` のみ許可。ダークカード: `bg-canvas-night text-on-dark rounded-lg`.

### インプット

```
bg-canvas text-ink border border-hairline rounded-sm px-3 py-2 text-base
focus:border-ink-mute-2 focus:outline-none
placeholder:text-ink-faint
```

### バッジ/ピル

- 通常: `bg-canvas-soft text-ink-mute text-xs rounded-full px-2 py-0.5`
- 強調（新機能等）: `bg-primary text-on-primary text-xs rounded-full px-2 py-0.5`

---

## セクション5: ダッシュボード・コンテンツページ

### ページ共通

| 要素 | スタイル |
|---|---|
| ページ背景 | `bg-canvas-soft`（現行の `bg-gray-50` から変更） |
| ページタイトル | `text-ink font-medium text-2xl tracking-tight` |
| セクション見出し | `text-ink font-medium text-lg` |
| サブテキスト | `text-ink-mute text-sm` |

### アラートバナー

| 種類 | スタイル |
|---|---|
| 故障アラート | `bg-[#fff3f0] border-l-4 border-accent-tomato text-ink rounded-md` |
| 低在庫アラート | `bg-[#fffbe0] border-l-4 border-accent-yellow text-ink rounded-md` |

### テーブル・リスト

| 要素 | スタイル |
|---|---|
| テーブルヘッダー | `bg-canvas-soft text-ink-mute text-xs font-medium` |
| 行ボーダー | `border-b border-hairline` |
| 行ホバー | `hover:bg-canvas-soft` |

### クイックアクションボタン（ダッシュボードトップ）

- **通常ボタン:** `bg-canvas border border-hairline rounded-lg hover:bg-canvas-soft` — アイコンのみ `text-primary`
- **メインCTA（集金記録追加）:** `bg-primary text-on-primary rounded-sm` — 1ページに1つのみ

---

## 対象ファイル一覧

### 必須変更

| ファイル | 変更内容 |
|---|---|
| `src/app/globals.css` | `@theme` ブロック追加 |
| `src/app/layout.tsx` | Inter フォント導入、Geist 削除 |
| `src/app/auth/layout.tsx` | グラデーション削除 |
| `src/app/auth/login/page.tsx` | カラー全置換 |
| `src/app/auth/register/page.tsx` | カラー全置換 |
| `src/app/auth/forgot-password/page.tsx` | カラー全置換 |
| `src/app/auth/reset-password/page.tsx` | カラー全置換 |
| `src/app/auth/invite/[token]/page.tsx` | カラー全置換 |
| `src/app/setup/page.tsx` | カラー全置換 |
| `src/app/dashboard/DashboardSidebar.tsx` | 全面リデザイン |
| `src/app/dashboard/page.tsx` | アラート・クイックアクション更新 |
| `src/app/dashboard/stores/page.tsx` | カラー全置換 |
| `src/app/dashboard/stores/[id]/page.tsx` | カラー全置換 |
| `src/app/dashboard/stores/[id]/edit/page.tsx` | カラー全置換 |
| `src/app/dashboard/stores/[id]/machines/page.tsx` | カラー全置換 |
| `src/app/dashboard/stores/[id]/inventory/page.tsx` | カラー全置換 |
| `src/app/dashboard/stores/[id]/collect/page.tsx` | カラー全置換 |
| `src/app/dashboard/stores/new/page.tsx` | カラー全置換 |
| `src/app/dashboard/collect/page.tsx` | カラー全置換 |
| `src/app/dashboard/collect/new/page.tsx` | カラー全置換 |
| `src/app/dashboard/collect/[id]/page.tsx` | カラー全置換 |
| `src/app/dashboard/collect/[id]/edit/page.tsx` | カラー全置換 |
| `src/app/dashboard/inventory/page.tsx` | カラー全置換 |
| `src/app/dashboard/members/page.tsx` | カラー全置換 |
| `src/app/dashboard/analytics/page.tsx` | カラー全置換 |
| `src/app/dashboard/logs/page.tsx` | カラー全置換 |
| `src/app/dashboard/profile/page.tsx` | カラー全置換 |
| `src/components/stores/StoreForm.tsx` | カラー全置換 |
| `src/components/stores/DeleteStoreButton.tsx` | カラー全置換 |
| `src/components/machines/AddMachineForm.tsx` | カラー全置換 |
| `src/components/machines/MachineList.tsx` | カラー全置換 |
| `src/components/collect/CollectionForm.tsx` | カラー全置換 |
| `src/components/members/MemberList.tsx` | カラー全置換 |
| `src/components/members/InviteForm.tsx` | カラー全置換 |
| `src/components/inventory/InventoryMatrix.tsx` | カラー全置換 |
| `src/components/inventory/InventoryTypeManager.tsx` | カラー全置換 |
| `src/components/inventory/StoreInventoryEditor.tsx` | カラー全置換 |
| `src/components/analytics/PeriodSelector.tsx` | カラー全置換 |
| `src/components/alerts/AlertBanner.tsx` | カラー全置換 |
| `src/components/logs/ActionLog.tsx` | カラー全置換 |
| `src/components/dashboard/QuickActionButtons.tsx` | カラー全置換 |

---

## 制約

- エメラルドグリーン (`bg-primary`) は1ビューポートに原則1つのみ（メインCTA）
- プライマリボタンのテキストは必ず `text-on-primary`（`#171717`）— 白は禁止
- 背景グラデーション禁止
- ボタン角丸は `rounded-sm`（6px）— `rounded-full` はピルタグのみ
- `indigo-*`, `blue-*`, `teal-*`, `green-*`（Tailwindデフォルト）は使用禁止。必ずトークンを使う
