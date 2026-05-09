# デザインシステム移行 (Supabaze Inspired) 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** IndigoベースのUIをDESIGN.mdで定義したSupabaze Inspiredデザイン言語（エメラルドグリーン単色アクセント・白キャンバス・Inter フォント）に全面移行する

**Architecture:** Tailwind v4 の `@theme` ブロックにデザイントークンを登録し、`bg-primary` / `text-ink` / `rounded-sm` などのユーティリティクラスとして使えるようにする。次に各ファイルの `indigo-*` / `gray-*` / `rounded-2xl` 等を新トークンに置換する。

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, next/font/google (Inter), React 19

---

## 共通クラス置換テーブル

本計画全体で使う置換ルール。各タスクの「Read → Modify」ステップで参照すること。

| 変更前 | 変更後 | 備考 |
|---|---|---|
| `bg-indigo-600` | `bg-primary` | プライマリボタン |
| `bg-indigo-700` | `bg-primary-deep` | hover状態 |
| `hover:bg-indigo-700` | `hover:bg-primary-deep` | |
| `bg-indigo-900` | `bg-canvas-night` | ダークサーフェス |
| `bg-indigo-50` | `bg-canvas-soft` | |
| `bg-teal-50` / `bg-orange-50` | `bg-canvas-soft` | |
| `bg-white` | `bg-canvas` | |
| `bg-gray-50` / `bg-gray-100` | `bg-canvas-soft` | |
| `text-indigo-600` | `text-primary` または `text-ink` | CTAはprimary、本文はink |
| `text-indigo-700` | `text-ink` | |
| `text-white` (indigoサーフェス上) | `text-on-primary` または `text-on-dark` | |
| `text-gray-900` / `text-gray-800` | `text-ink` | |
| `text-gray-700` | `text-ink-secondary` | |
| `text-gray-600` / `text-gray-500` | `text-ink-mute` | |
| `text-gray-400` / `text-gray-300` | `text-ink-mute-2` | |
| `text-gray-200` | `text-ink-faint` | |
| `border-gray-100` / `border-gray-200` | `border-hairline` | |
| `border-gray-300` | `border-hairline-strong` | |
| `border-indigo-*` | `border-hairline` または `border-primary` | コンテキスト次第 |
| `focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500` | `focus:border-ink-mute-2 focus:outline-none` | ring廃止 |
| `rounded-2xl` | `rounded-xl` | カード外側 |
| `rounded-xl` | `rounded-lg` | カード内側・ページコンテナ |
| `rounded-lg` (ボタン) | `rounded-sm` | ボタンは6px |
| `rounded-lg` (インプット) | `rounded-sm` | インプットは6px |
| `rounded-lg` (カード) | `rounded-lg` | カードは12px — 変更不要 |
| `shadow-lg` | `shadow-sm` | |
| `shadow-sm border border-gray-100` | `border border-hairline` | shadowをborderに置換 |
| `bg-red-50 border border-red-200 ... text-red-700` | `bg-[#fff3f0] border border-accent-tomato/30 ... text-accent-tomato` | エラー表示 |
| `bg-amber-50 border border-amber-200` | `bg-[#fffbe0] border-l-4 border-accent-yellow` | 低在庫アラート |
| `text-red-500` / `text-red-600` | `text-accent-tomato` | |
| `text-amber-500` / `text-amber-700` | `text-ink` / `text-ink-mute` | |
| `bg-gradient-to-br from-indigo-50 to-blue-100` | `bg-canvas` | グラデーション廃止 |

---

## Task 1: デザイントークン + フォント基盤を設定する

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: globals.css を全面書き換えする**

`src/app/globals.css` の内容をそのまま以下に置き換える:

```css
@import "tailwindcss";

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

  /* カラー: アクセント（アラートのみ） */
  --color-accent-tomato: #ff2201;
  --color-accent-yellow: #ffdb13;

  /* フォント */
  --font-sans: var(--font-inter);
  --font-mono: ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;

  /* 角丸（Tailwind v4 デフォルトを上書き） */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

body {
  background: #ffffff;
  color: #171717;
}
```

- [ ] **Step 2: layout.tsx を書き換えて Inter を導入する**

`src/app/layout.tsx` の内容をそのまま以下に置き換える:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Collecie",
  description: "コインランドリー集金管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: ビルドを確認する**

```bash
npm run build
```

期待: ビルドエラーなし。TypeScript / ESLintエラーなし。

- [ ] **Step 4: コミットする**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: Supabaze Inspired デザイントークン + Inter フォントを設定"
```

---

## Task 2: ダッシュボードレイアウト + サイドバーをリデザインする

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/app/dashboard/DashboardSidebar.tsx`

- [ ] **Step 1: dashboard/layout.tsx の背景色を1箇所変更する**

`src/app/dashboard/layout.tsx` の:
```tsx
<div className="flex h-screen overflow-hidden bg-gray-50">
```
を以下に変更:
```tsx
<div className="flex h-screen overflow-hidden bg-canvas-soft">
```

- [ ] **Step 2: DashboardSidebar.tsx を全面置換する**

`src/app/dashboard/DashboardSidebar.tsx` の内容をそのまま以下に置き換える:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Store,
  Wallet,
  Package,
  Users,
  BarChart3,
  User,
  Activity,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

type Role = 'admin' | 'collecter' | 'viewer'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'ホーム', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/dashboard/stores', label: '店舗管理', icon: <Store className="h-5 w-5" /> },
  { href: '/dashboard/collect', label: '集金記録', icon: <Wallet className="h-5 w-5" /> },
  { href: '/dashboard/inventory', label: '在庫管理', icon: <Package className="h-5 w-5" /> },
  { href: '/dashboard/members', label: 'メンバー管理', icon: <Users className="h-5 w-5" />, adminOnly: true },
  { href: '/dashboard/analytics', label: 'ダッシュボード', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/dashboard/logs', label: 'アクションログ', icon: <Activity className="h-5 w-5" /> },
  { href: '/dashboard/profile', label: 'プロフィール', icon: <User className="h-5 w-5" /> },
]

const roleLabels: Record<Role, string> = {
  admin: '管理者',
  collecter: '集金担当者',
  viewer: '閲覧者',
}

interface Props {
  role: Role
  fullName: string | null
  username: string | null
}

export default function DashboardSidebar({ role, fullName, username }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const visibleItems = navItems.filter((item) => !item.adminOnly || role === 'admin')
  const displayName = fullName ?? username ?? 'ユーザー'

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-hairline">
        <Link href="/dashboard" className="block" onClick={() => setMobileOpen(false)}>
          <span className="text-2xl font-medium text-ink tracking-tight">Collecie</span>
          <p className="text-xs text-ink-mute mt-0.5">コインランドリー集金管理</p>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition ${
              isActive(item.href)
                ? 'text-ink bg-canvas-soft border-l-2 border-primary pl-[10px]'
                : 'text-ink-mute hover:bg-canvas-soft hover:text-ink'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-hairline">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink text-sm font-medium flex-shrink-0">
            {displayName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink truncate">{displayName}</div>
            <span className="inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded-full bg-canvas-soft text-ink-mute">
              {roleLabels[role]}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" title="ログアウト" className="text-ink-mute hover:text-ink transition">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 bg-canvas border-r border-hairline h-screen">
        <SidebarContent />
      </aside>

      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-canvas text-ink border border-hairline rounded-md shadow-sm"
        onClick={() => setMobileOpen(true)}
        aria-label="メニューを開く"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 flex flex-col w-72 bg-canvas border-r border-hairline h-full shadow-xl">
            <button
              className="absolute top-4 right-4 text-ink-mute hover:text-ink"
              onClick={() => setMobileOpen(false)}
              aria-label="メニューを閉じる"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: ビルドを確認する**

```bash
npm run build
```

期待: エラーなし。

- [ ] **Step 4: コミットする**

```bash
git add src/app/dashboard/layout.tsx src/app/dashboard/DashboardSidebar.tsx
git commit -m "feat: サイドバーをライトスタイルにリデザイン"
```

---

## Task 3: 認証レイアウト + ログインページをリデザインする

**Files:**
- Modify: `src/app/auth/layout.tsx`
- Modify: `src/app/auth/login/page.tsx`

- [ ] **Step 1: auth/layout.tsx を書き換える**

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Collecie - 認証',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-medium text-ink tracking-tight">Collecie</h1>
        <p className="mt-2 text-sm text-ink-mute">コインランドリー集金管理</p>
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: auth/login/page.tsx を書き換える**

```tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react'
import { loginAction } from '@/app/auth/actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="w-full max-w-md bg-canvas border border-hairline rounded-xl shadow-sm p-8">
      <h2 className="text-2xl font-medium text-ink mb-6 text-center">ログイン</h2>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-md bg-[#fff3f0] border border-accent-tomato/30 px-4 py-3 text-sm text-accent-tomato">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-mute mb-1">
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink-mute mb-1">
            パスワード
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-xs text-ink-mute underline hover:text-ink transition">
            パスワードを忘れた方
          </Link>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-deep disabled:opacity-50 text-on-primary font-medium py-2.5 px-4 rounded-sm transition"
        >
          <LogIn className="h-4 w-4" />
          {isPending ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mute">
        アカウントをお持ちでない方は{' '}
        <Link href="/auth/register" className="text-ink font-medium underline hover:text-ink-mute transition">
          アカウント作成
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: ビルドを確認する**

```bash
npm run build
```

- [ ] **Step 4: コミットする**

```bash
git add src/app/auth/layout.tsx src/app/auth/login/page.tsx
git commit -m "feat: 認証レイアウト・ログインページをリデザイン"
```

---

## Task 4: 登録ページ + セットアップページをリデザインする

**Files:**
- Modify: `src/app/auth/register/page.tsx`
- Modify: `src/app/setup/page.tsx`
- Modify: `src/app/setup/SetupForm.tsx`

- [ ] **Step 1: auth/register/page.tsx を書き換える**

```tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, Lock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { registerAction } from '@/app/auth/actions'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await registerAction(formData)
      if (result?.error) setError(result.error)
      else if (result?.success) setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="w-full max-w-md bg-canvas border border-hairline rounded-xl shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-medium text-ink mb-3">確認メールを送信しました</h2>
        <p className="text-sm text-ink-mute mb-6">
          メールをご確認ください。
          <br />
          メール内のリンクをクリックしてアカウントを有効化してください。
        </p>
        <Link href="/auth/login" className="text-ink font-medium underline hover:text-ink-mute transition text-sm">
          ログインページへ
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-canvas border border-hairline rounded-xl shadow-sm p-8">
      <h2 className="text-2xl font-medium text-ink mb-6 text-center">アカウント作成</h2>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-md bg-[#fff3f0] border border-accent-tomato/30 px-4 py-3 text-sm text-accent-tomato">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-mute mb-1">メールアドレス</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              id="email" name="email" type="email" required autoComplete="email"
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink-mute mb-1">パスワード</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              id="password" name="password" type="password" required autoComplete="new-password"
              placeholder="6文字以上"
              className="w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium text-ink-mute mb-1">パスワード（確認）</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              id="passwordConfirm" name="passwordConfirm" type="password" required autoComplete="new-password"
              placeholder="パスワードを再入力"
              className="w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition"
            />
          </div>
        </div>

        <button
          type="submit" disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-deep disabled:opacity-50 text-on-primary font-medium py-2.5 px-4 rounded-sm transition"
        >
          <UserPlus className="h-4 w-4" />
          {isPending ? '作成中...' : 'アカウント作成'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mute">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/auth/login" className="text-ink font-medium underline hover:text-ink-mute transition">
          ログインはこちら
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: setup/page.tsx のグラデーションを削除する**

`src/app/setup/page.tsx` で以下を変更:

```tsx
// 変更前
<div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-center px-4 py-12">
  <div className="mb-8 text-center">
    <h1 className="text-4xl font-bold text-indigo-700 tracking-tight">Collecie</h1>
    <p className="mt-2 text-sm text-gray-500">コインランドリー集金管理</p>
  </div>

// 変更後
<div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
  <div className="mb-8 text-center">
    <h1 className="text-4xl font-medium text-ink tracking-tight">Collecie</h1>
    <p className="mt-2 text-sm text-ink-mute">コインランドリー集金管理</p>
  </div>
```

- [ ] **Step 3: setup/SetupForm.tsx を修正する**

`src/app/setup/SetupForm.tsx` を読む。以下のパターンで一括置換する（共通テーブル参照）:
- `bg-indigo-600` → `bg-primary`
- `hover:bg-indigo-700` → `hover:bg-primary-deep`
- `text-white` (indigoボタン上) → `text-on-primary`
- `rounded-lg` (ボタン・インプット) → `rounded-sm`
- `rounded-xl` / `rounded-2xl` → `rounded-lg`
- `border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500` → `border-hairline focus:border-ink-mute-2 focus:outline-none`
- `text-gray-*` → 共通テーブル参照
- `bg-white` → `bg-canvas`
- `shadow-lg` → `shadow-sm`

- [ ] **Step 4: ビルドを確認する**

```bash
npm run build
```

- [ ] **Step 5: コミットする**

```bash
git add src/app/auth/register/page.tsx src/app/setup/page.tsx src/app/setup/SetupForm.tsx
git commit -m "feat: 登録ページ・セットアップページをリデザイン"
```

---

## Task 5: 残りの認証ページをリデザインする

**Files:**
- Modify: `src/app/auth/forgot-password/page.tsx`
- Modify: `src/app/auth/reset-password/page.tsx`
- Modify: `src/app/auth/invite/[token]/page.tsx`

これらは login/register と同じパターン。各ファイルを読んで以下を適用する:

- [ ] **Step 1: forgot-password/page.tsx を修正する**

ファイルを読み、共通テーブルに従って置換。カードは `bg-canvas border border-hairline rounded-xl shadow-sm p-8`。ボタンは `bg-primary text-on-primary rounded-sm`。インプットは `border-hairline rounded-sm focus:border-ink-mute-2 focus:outline-none`。

- [ ] **Step 2: reset-password/page.tsx を修正する**

同上。

- [ ] **Step 3: invite/[token]/page.tsx を修正する**

同上。成功チェックアイコンがある場合は `text-primary` を使う（現行の `text-green-*` を置換）。

- [ ] **Step 4: ビルドを確認する**

```bash
npm run build
```

- [ ] **Step 5: コミットする**

```bash
git add src/app/auth/
git commit -m "feat: 残りの認証ページをリデザイン"
```

---

## Task 6: AlertBanner + QuickActionButtons をリデザインする

**Files:**
- Modify: `src/components/alerts/AlertBanner.tsx`
- Modify: `src/components/dashboard/QuickActionButtons.tsx`

- [ ] **Step 1: AlertBanner.tsx を全面置換する**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Wrench, X } from 'lucide-react'

interface BrokenMachine {
  id: string
  name: string
  storeName: string
}

interface LowInventoryItem {
  id: string
  typeName: string
  storeName: string
  quantity: number
}

interface Props {
  brokenMachines: BrokenMachine[]
  lowInventoryItems: LowInventoryItem[]
}

const DISMISS_KEY_BROKEN = 'collecie_dismiss_broken_'
const DISMISS_KEY_LOW = 'collecie_dismiss_low_'

export default function AlertBanner({ brokenMachines, lowInventoryItems }: Props) {
  const [brokenDismissed, setBrokenDismissed] = useState(false)
  const [lowDismissed, setLowDismissed] = useState(false)

  const brokenKey = DISMISS_KEY_BROKEN + brokenMachines.map((m) => m.id).join('_')
  const lowKey = DISMISS_KEY_LOW + lowInventoryItems.map((i) => i.id).join('_')

  useEffect(() => {
    setBrokenDismissed(localStorage.getItem(brokenKey) === '1')
    setLowDismissed(localStorage.getItem(lowKey) === '1')
  }, [brokenKey, lowKey])

  function dismissBroken() {
    localStorage.setItem(brokenKey, '1')
    setBrokenDismissed(true)
  }

  function dismissLow() {
    localStorage.setItem(lowKey, '1')
    setLowDismissed(true)
  }

  if (brokenMachines.length === 0 && lowInventoryItems.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {brokenMachines.length > 0 && !brokenDismissed && (
        <div className="flex items-start gap-3 bg-[#fff3f0] border-l-4 border-accent-tomato rounded-md px-4 py-3">
          <Wrench className="h-5 w-5 text-accent-tomato flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">故障中の機器があります</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {brokenMachines.slice(0, 5).map((m) => (
                <span key={m.id} className="text-xs text-ink-mute">{m.storeName} / {m.name}</span>
              ))}
              {brokenMachines.length > 5 && (
                <span className="text-xs text-ink-mute">他 {brokenMachines.length - 5}件</span>
              )}
            </div>
            <Link
              href="/dashboard/stores"
              className="inline-block mt-1.5 text-xs font-medium text-ink-mute underline hover:text-ink underline-offset-2"
            >
              店舗管理で確認する
            </Link>
          </div>
          <button onClick={dismissBroken} aria-label="閉じる" className="flex-shrink-0 text-ink-mute hover:text-ink transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {lowInventoryItems.length > 0 && !lowDismissed && (
        <div className="flex items-start gap-3 bg-[#fffbe0] border-l-4 border-accent-yellow rounded-md px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-ink-mute flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">在庫が少なくなっています</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {lowInventoryItems.slice(0, 5).map((item) => (
                <span key={item.id} className="text-xs text-ink-mute">
                  {item.storeName} / {item.typeName}: {item.quantity}
                </span>
              ))}
              {lowInventoryItems.length > 5 && (
                <span className="text-xs text-ink-mute">他 {lowInventoryItems.length - 5}件</span>
              )}
            </div>
            <Link
              href="/dashboard/inventory"
              className="inline-block mt-1.5 text-xs font-medium text-ink-mute underline hover:text-ink underline-offset-2"
            >
              在庫管理で確認する
            </Link>
          </div>
          <button onClick={dismissLow} aria-label="閉じる" className="flex-shrink-0 text-ink-mute hover:text-ink transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: QuickActionButtons.tsx を全面置換する**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Package, Wrench, X, ChevronRight } from 'lucide-react'

interface Store {
  id: string
  name: string
}

type ActionType = 'collect' | 'inventory' | 'machines'

interface ActionConfig {
  key: ActionType
  label: string
  description: string
  Icon: React.FC<{ className?: string }>
  isPrimary?: boolean
}

const ACTIONS: ActionConfig[] = [
  { key: 'collect', label: '集金', description: '集金を記録する', Icon: Wallet, isPrimary: true },
  { key: 'inventory', label: '在庫管理', description: '在庫数を更新する', Icon: Package },
  { key: 'machines', label: '設備状況', description: '機器の状態を確認・更新する', Icon: Wrench },
]

function getHref(action: ActionType, storeId: string): string {
  switch (action) {
    case 'collect': return `/dashboard/collect/new?store=${storeId}`
    case 'inventory': return `/dashboard/stores/${storeId}/inventory`
    case 'machines': return `/dashboard/stores/${storeId}/machines`
  }
}

export default function QuickActionButtons({ stores }: { stores: Store[] }) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)

  function handleActionClick(action: ActionType) {
    if (stores.length === 0) return
    if (stores.length === 1) router.push(getHref(action, stores[0].id))
    else setActiveAction(action)
  }

  const activeConfig = ACTIONS.find((a) => a.key === activeAction)

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium text-ink-mute-2 uppercase tracking-widest mb-3">クイックアクション</p>
        <div className="grid grid-cols-3 gap-3">
          {ACTIONS.map(({ key, label, Icon, isPrimary }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleActionClick(key)}
              disabled={stores.length === 0}
              className={`flex flex-col items-center gap-2.5 py-5 px-3 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isPrimary
                  ? 'bg-primary border-primary/20 hover:bg-primary-deep'
                  : 'bg-canvas border-hairline hover:bg-canvas-soft'
              }`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isPrimary ? 'bg-black/10' : 'bg-canvas-soft'}`}>
                <Icon className={`h-6 w-6 ${isPrimary ? 'text-on-primary' : 'text-primary'}`} />
              </div>
              <span className={`text-sm font-medium ${isPrimary ? 'text-on-primary' : 'text-ink'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveAction(null)} />
          <div className="relative bg-canvas rounded-xl border border-hairline shadow-lg w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-canvas-soft flex items-center justify-center">
                  {activeConfig && <activeConfig.Icon className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <p className="text-base font-medium text-ink">{activeConfig?.label}</p>
                  <p className="text-xs text-ink-mute">{activeConfig?.description}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveAction(null)}
                className="p-1.5 rounded-md text-ink-mute hover:text-ink hover:bg-canvas-soft transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 max-h-72 overflow-y-auto">
              <p className="text-xs font-medium text-ink-mute px-2 mb-2">店舗を選択</p>
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => { router.push(getHref(activeAction, store.id)); setActiveAction(null) }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-md hover:bg-canvas-soft transition text-left group"
                >
                  <span className="text-sm font-medium text-ink group-hover:text-primary transition">{store.name}</span>
                  <ChevronRight className="h-4 w-4 text-ink-faint group-hover:text-primary transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: ビルドを確認する**

```bash
npm run build
```

- [ ] **Step 4: コミットする**

```bash
git add src/components/alerts/AlertBanner.tsx src/components/dashboard/QuickActionButtons.tsx
git commit -m "feat: AlertBanner・QuickActionButtonsをリデザイン"
```

---

## Task 7: ダッシュボードトップページをリデザインする

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: dashboard/page.tsx を全面置換する**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Store, Wrench, AlertTriangle, Wallet, Plus } from 'lucide-react'
import AlertBanner from '@/components/alerts/AlertBanner'
import QuickActionButtons from '@/components/dashboard/QuickActionButtons'
import type { InventoryType, LaundryInventory } from '@/types/database'

interface InventoryWithType extends LaundryInventory {
  inventory_types: InventoryType | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, role')
    .eq('id', user.id)
    .single()

  const { data: memberRecord } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let orgName: string | null = null
  let storeCount = 0
  let brokenMachineCount = 0
  let lowInventoryCount = 0
  let quickStores: { id: string; name: string }[] = []

  type BrokenMachine = { id: string; name: string; storeName: string }
  type LowInventoryItem = { id: string; typeName: string; storeName: string; quantity: number }

  const brokenMachines: BrokenMachine[] = []
  const lowInventoryItems: LowInventoryItem[] = []

  if (memberRecord?.org_id) {
    const { data: org } = await supabase.from('organizations').select('name').eq('id', memberRecord.org_id).single()
    orgName = org?.name ?? null

    const { data: stores, count: storeCountResult } = await supabase
      .from('laundry_store')
      .select('id, name', { count: 'exact' })
      .eq('organization_id', memberRecord.org_id)
      .order('created_at', { ascending: true })

    storeCount = storeCountResult ?? 0
    quickStores = (stores ?? []) as { id: string; name: string }[]

    if (stores && stores.length > 0) {
      const storeIds = stores.map((s) => s.id)
      const storeMap = Object.fromEntries(stores.map((s) => [s.id, s.name]))

      const { data: brokenData } = await supabase
        .from('machines')
        .select('id, name, laundry_id')
        .eq('is_broken', true)
        .in('laundry_id', storeIds)

      if (brokenData) {
        brokenMachineCount = brokenData.length
        brokenData.forEach((m) => {
          brokenMachines.push({ id: m.id, name: m.name, storeName: storeMap[m.laundry_id] ?? '不明' })
        })
      }

      const { data: inventoryData } = await supabase
        .from('laundry_inventory')
        .select('*, inventory_types(*)')
        .in('laundry_id', storeIds)

      if (inventoryData) {
        const typed = inventoryData as InventoryWithType[]
        const lowItems = typed.filter((inv) => {
          const threshold = inv.inventory_types?.alert_threshold ?? 2
          return inv.quantity < threshold
        })
        lowInventoryCount = lowItems.length
        lowItems.forEach((inv) => {
          lowInventoryItems.push({
            id: inv.id,
            typeName: inv.inventory_types?.name ?? '不明',
            storeName: storeMap[inv.laundry_id] ?? '不明',
            quantity: inv.quantity,
          })
        })
      }
    }
  }

  const displayName = profile?.full_name ?? profile?.username ?? 'ユーザー'

  return (
    <div>
      <AlertBanner brokenMachines={brokenMachines} lowInventoryItems={lowInventoryItems} />

      <div className="mb-8">
        <h1 className="text-2xl font-medium text-ink tracking-tight">
          おかえりなさい、{displayName}さん
        </h1>
        {orgName && <p className="mt-1 text-sm text-ink-mute">{orgName}</p>}
      </div>

      {storeCount > 0 && <QuickActionButtons stores={quickStores} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Wallet className="h-6 w-6 text-primary" />}
          label="今月の集金額"
          value="—"
          placeholder
        />
        <StatCard
          icon={<Store className="h-6 w-6 text-primary" />}
          label="登録店舗数"
          value={storeCount.toString()}
        />
        <StatCard
          icon={<Wrench className="h-6 w-6 text-primary" />}
          label="故障中機器"
          value={brokenMachineCount > 0 ? brokenMachineCount.toString() : '—'}
          placeholder={brokenMachineCount === 0}
          alert={brokenMachineCount > 0}
        />
        <StatCard
          icon={<AlertTriangle className="h-6 w-6 text-primary" />}
          label="低在庫アラート"
          value={lowInventoryCount > 0 ? lowInventoryCount.toString() : '—'}
          placeholder={lowInventoryCount === 0}
          alert={lowInventoryCount > 0}
        />
      </div>

      {storeCount === 0 && (
        <div className="rounded-lg border-2 border-dashed border-hairline bg-canvas p-10 text-center">
          <Store className="mx-auto h-12 w-12 text-ink-faint mb-4" />
          <h3 className="text-lg font-medium text-ink mb-1">まず店舗を登録しましょう</h3>
          <p className="text-sm text-ink-mute mb-5">
            店舗を登録すると、集金記録や在庫管理が始められます。
          </p>
          <Link
            href="/dashboard/stores/new"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-deep text-on-primary text-sm font-medium px-5 py-2.5 rounded-sm transition"
          >
            <Plus className="h-4 w-4" />
            店舗を登録する
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon, label, value, placeholder, alert,
}: {
  icon: React.ReactNode
  label: string
  value: string
  placeholder?: boolean
  alert?: boolean
}) {
  return (
    <div className="bg-canvas rounded-lg border border-hairline p-5 flex items-center gap-4">
      <div className="bg-canvas-soft p-3 rounded-lg flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-ink-mute mb-0.5">{label}</p>
        <p className={`text-2xl font-medium ${placeholder ? 'text-ink-faint' : alert ? 'text-accent-tomato' : 'text-ink'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: ビルドを確認する**

```bash
npm run build
```

- [ ] **Step 3: コミットする**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: ダッシュボードトップページをリデザイン"
```

---

## Task 8: 店舗ページ群をリデザインする

**Files:**
- Modify: `src/app/dashboard/stores/page.tsx`
- Modify: `src/app/dashboard/stores/[id]/page.tsx`
- Modify: `src/app/dashboard/stores/[id]/edit/page.tsx`
- Modify: `src/app/dashboard/stores/new/page.tsx`
- Modify: `src/app/dashboard/stores/[id]/machines/page.tsx`
- Modify: `src/app/dashboard/stores/[id]/inventory/page.tsx`
- Modify: `src/app/dashboard/stores/[id]/collect/page.tsx`

- [ ] **Step 1: stores/page.tsx を全面置換する**

```tsx
import Link from 'next/link'
import { MapPin, Plus, Store, Wrench, WashingMachine } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { LaundryStore, Machine } from '@/types/database'

interface StoreWithMachines extends LaundryStore {
  machines: Machine[]
}

export default async function StoresPage() {
  const { profile, membership } = await getCurrentUserWithOrg()
  const isAdmin = profile.role === 'admin'

  const supabase = await createClient()
  let stores: StoreWithMachines[] = []

  if (membership?.org_id) {
    const { data } = await supabase
      .from('laundry_store')
      .select('*, machines(*)')
      .eq('organization_id', membership.org_id)
      .order('created_at', { ascending: false })

    stores = (data ?? []) as StoreWithMachines[]
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">店舗管理</h1>
          <p className="mt-1 text-sm text-ink-mute">登録されている店舗の一覧です</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/stores/new"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-deep text-on-primary text-sm font-medium px-4 py-2.5 rounded-sm transition"
          >
            <Plus className="h-4 w-4" />
            新規店舗追加
          </Link>
        )}
      </div>

      {stores.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-hairline bg-canvas p-12 text-center">
          <Store className="mx-auto h-12 w-12 text-ink-faint mb-4" />
          <h3 className="text-lg font-medium text-ink mb-1">店舗がまだ登録されていません</h3>
          <p className="text-sm text-ink-mute mb-6">
            店舗を登録すると、集金記録や在庫管理が始められます。
          </p>
          {isAdmin && (
            <Link
              href="/dashboard/stores/new"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-deep text-on-primary text-sm font-medium px-5 py-2.5 rounded-sm transition"
            >
              <Plus className="h-4 w-4" />
              最初の店舗を登録する
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {stores.map((store) => {
            const totalMachines = store.machines.length
            const brokenMachines = store.machines.filter((m) => m.is_broken).length
            const imageUrls: string[] = Array.isArray(store.images) ? (store.images as string[]) : []
            const firstImage = imageUrls[0] ?? null

            return (
              <Link
                key={store.id}
                href={`/dashboard/stores/${store.id}`}
                className="group bg-canvas rounded-lg border border-hairline hover:border-hairline-strong hover:shadow-sm transition-all duration-200 overflow-hidden"
              >
                <div className="relative h-40 overflow-hidden bg-canvas-soft">
                  {firstImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={firstImage}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="h-14 w-14 text-ink-faint" />
                    </div>
                  )}

                  {brokenMachines > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-tomato text-on-dark text-xs font-medium rounded-full">
                        <Wrench className="h-3 w-3" />
                        故障 {brokenMachines}台
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-5 py-4">
                  <h2 className="text-base font-medium text-ink truncate group-hover:text-primary transition-colors mb-1">
                    {store.name}
                  </h2>
                  {store.location && (
                    <div className="flex items-center gap-1.5 text-sm text-ink-mute mb-3">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
                      <span className="truncate">{store.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-canvas-soft text-ink-mute text-xs font-medium rounded-full">
                      <WashingMachine className="h-3.5 w-3.5" />
                      {totalMachines}台
                    </span>
                    {totalMachines === 0 && (
                      <span className="text-xs text-ink-faint">機器未登録</span>
                    )}
                  </div>

                  {store.description && (
                    <p className="mt-2 text-sm text-ink-mute line-clamp-2">{store.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 残りの stores/* ページを修正する**

各ファイルを読み、共通テーブルに従って置換する。特に注意:
- ページタイトル: `text-gray-900 font-bold` → `text-ink font-medium tracking-tight`
- 戻るリンク: `text-indigo-600` → `text-ink underline`
- 編集ボタン: `bg-indigo-600 text-white rounded-lg` → `bg-primary text-on-primary rounded-sm`
- 削除ボタン: `bg-red-*` → `bg-canvas text-accent-tomato border border-hairline-strong rounded-sm`
- カードコンテナ: `bg-white shadow-sm border border-gray-100 rounded-xl` → `bg-canvas border border-hairline rounded-lg`

- [ ] **Step 3: ビルドを確認する**

```bash
npm run build
```

- [ ] **Step 4: コミットする**

```bash
git add src/app/dashboard/stores/
git commit -m "feat: 店舗ページ群をリデザイン"
```

---

## Task 9: 店舗コンポーネントをリデザインする

**Files:**
- Modify: `src/components/stores/StoreForm.tsx`
- Modify: `src/components/stores/DeleteStoreButton.tsx`

- [ ] **Step 1: StoreForm.tsx を全面置換する**

```tsx
'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Store, MapPin, FileText, ImagePlus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createStoreAction, updateStoreAction } from '@/app/dashboard/stores/actions'
import type { LaundryStore } from '@/types/database'

interface StoreFormProps {
  mode: 'create' | 'edit'
  store?: LaundryStore
}

export default function StoreForm({ mode, store }: StoreFormProps) {
  const router = useRouter()
  const [name, setName] = useState(store?.name ?? '')
  const [location, setLocation] = useState(store?.location ?? '')
  const [description, setDescription] = useState(store?.description ?? '')
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (!store?.images) return []
    if (Array.isArray(store.images)) return store.images as string[]
    return []
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error: uploadError } = await supabase.storage
        .from('laundry-images')
        .upload(`laundry/${filename}`, file)
      if (uploadError) { setError('画像のアップロードに失敗しました。'); return }
      const { data: publicData } = supabase.storage.from('laundry-images').getPublicUrl(data.path)
      setImageUrls((prev) => [...prev, publicData.publicUrl])
    } catch {
      setError('画像のアップロードに失敗しました。')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('店舗名を入力してください。'); return }
    if (!location.trim()) { setError('所在地を入力してください。'); return }

    const formData = new FormData()
    formData.set('name', name)
    formData.set('location', location)
    formData.set('description', description)
    formData.set('images', JSON.stringify(imageUrls))

    startTransition(async () => {
      let result: { error: string } | undefined
      if (mode === 'create') result = await createStoreAction(formData) as { error: string } | undefined
      else if (mode === 'edit' && store) result = await updateStoreAction(store.id, formData) as { error: string } | undefined
      if (result?.error) setError(result.error)
    })
  }

  const inputClass = "w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition"

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-[#fff3f0] border border-accent-tomato/30 px-4 py-3 text-sm text-accent-tomato">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink-mute mb-1">
          店舗名 <span className="text-accent-tomato">*</span>
        </label>
        <div className="relative">
          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <input
            id="name" type="text" required value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: コインランドリー渋谷店"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-ink-mute mb-1">
          所在地 <span className="text-accent-tomato">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <input
            id="location" type="text" required value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: 東京都渋谷区渋谷1-2-3"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink-mute mb-1">
          備考 <span className="text-ink-faint text-xs">(任意)</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-ink-faint" />
          <textarea
            id="description" value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="店舗に関するメモや特記事項など"
            rows={3}
            className="w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition resize-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-mute mb-2">
          店舗画像 <span className="text-ink-faint text-xs">(任意)</span>
        </label>

        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden border border-hairline group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`店舗画像 ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/60 text-on-dark rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 border border-dashed border-hairline-strong rounded-sm hover:border-primary hover:bg-canvas-soft transition text-sm text-ink-mute">
          {uploadingImage ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-4 w-4 text-ink-faint" />
          )}
          {uploadingImage ? 'アップロード中...' : '画像を追加'}
          <input
            ref={fileInputRef} type="file" accept="image/*"
            onChange={handleImageUpload} disabled={uploadingImage} className="hidden"
          />
        </label>
        <p className="mt-1 text-xs text-ink-faint">PNG, JPG, WEBP など対応</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-ink bg-canvas border border-hairline-strong hover:bg-canvas-soft rounded-sm transition"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isPending || uploadingImage}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-deep disabled:opacity-50 disabled:cursor-not-allowed text-on-primary text-sm font-medium rounded-sm transition"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'create' ? '店舗を登録する' : '変更を保存する'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: DeleteStoreButton.tsx を修正する**

ファイルを読み、共通テーブルに従って:
- 削除ボタン: `bg-red-600 text-white rounded-lg` → `bg-canvas text-accent-tomato border border-hairline-strong hover:bg-[#fff3f0] rounded-sm`

- [ ] **Step 3: ビルドを確認する**

```bash
npm run build
```

- [ ] **Step 4: コミットする**

```bash
git add src/components/stores/
git commit -m "feat: 店舗コンポーネントをリデザイン"
```

---

## Task 10: 集金ページ + フォームをリデザインする

**Files:**
- Modify: `src/app/dashboard/collect/page.tsx`
- Modify: `src/app/dashboard/collect/new/page.tsx`
- Modify: `src/app/dashboard/collect/[id]/page.tsx`
- Modify: `src/app/dashboard/collect/[id]/edit/page.tsx`
- Modify: `src/components/collect/CollectionForm.tsx`

- [ ] **Step 1: 各ファイルを読み、共通テーブルに従って置換する**

重要な置換パターン:
- `bg-indigo-600 text-white rounded-lg` → `bg-primary text-on-primary rounded-sm`
- `bg-green-*` (集金成功表示) → `bg-canvas-soft text-ink`
- `text-green-600` → `text-primary` (金額の強調)
- フォーム入力: `border-gray-300 focus:ring-indigo-500` → `border-hairline focus:border-ink-mute-2 focus:outline-none`
- カード: `bg-white shadow-sm border-gray-100 rounded-xl` → `bg-canvas border-hairline rounded-lg`
- ページヘッダー: `text-gray-900 font-bold` → `text-ink font-medium tracking-tight`
- テーブル行: `hover:bg-gray-50` → `hover:bg-canvas-soft`
- テーブルヘッダー: `bg-gray-50 text-gray-500` → `bg-canvas-soft text-ink-mute`
- ページネーション: `bg-indigo-600` → `bg-primary`, `text-gray-500` → `text-ink-mute`

- [ ] **Step 2: ビルドを確認する**

```bash
npm run build
```

- [ ] **Step 3: コミットする**

```bash
git add src/app/dashboard/collect/ src/components/collect/
git commit -m "feat: 集金ページ・フォームをリデザイン"
```

---

## Task 11: 機器コンポーネントをリデザインする

**Files:**
- Modify: `src/components/machines/MachineList.tsx`
- Modify: `src/components/machines/AddMachineForm.tsx`

- [ ] **Step 1: MachineList.tsx を全面置換する**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle, Wrench, MessageSquare, Trash2, Loader2 } from 'lucide-react'
import type { Machine } from '@/types/database'
import {
  updateMachineStatusAction,
  deleteMachineAction,
} from '@/app/dashboard/stores/[id]/machines/actions'

interface MachineListProps {
  machines: Machine[]
  isAdmin: boolean
  canEdit: boolean
}

interface MachineRowProps {
  machine: Machine
  isAdmin: boolean
  canEdit: boolean
}

function MachineRow({ machine, isAdmin, canEdit }: MachineRowProps) {
  const [isBroken, setIsBroken] = useState(machine.is_broken)
  const [comment, setComment] = useState(machine.comment ?? '')
  const [editingComment, setEditingComment] = useState(false)
  const [draftComment, setDraftComment] = useState(machine.comment ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggleStatus() {
    const newStatus = !isBroken
    setIsBroken(newStatus)
    setError(null)
    startTransition(async () => {
      const result = await updateMachineStatusAction(machine.id, newStatus, comment)
      if (result?.error) { setIsBroken(!newStatus); setError(result.error) }
    })
  }

  function saveComment() {
    setError(null)
    startTransition(async () => {
      const result = await updateMachineStatusAction(machine.id, isBroken, draftComment)
      if (result?.error) setError(result.error)
      else { setComment(draftComment); setEditingComment(false) }
    })
  }

  function handleDelete() {
    if (!confirm(`「${machine.name}」を削除しますか？この操作は取り消せません。`)) return
    startTransition(async () => {
      const result = await deleteMachineAction(machine.id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div
      className={`rounded-lg border transition-all ${
        isBroken ? 'border-accent-tomato/30 bg-[#fff3f0]' : 'border-hairline bg-canvas'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 p-4">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isBroken ? 'bg-[#ffece8]' : 'bg-canvas-soft'
          }`}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin text-ink-mute" />
          ) : isBroken ? (
            <AlertTriangle className="h-5 w-5 text-accent-tomato" />
          ) : (
            <CheckCircle className="h-5 w-5 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">{machine.name}</span>
            <span className="text-xs text-ink-mute bg-canvas-soft px-1.5 py-0.5 rounded">
              ×{machine.unit_count}台
            </span>
          </div>
          <span className={`text-xs font-medium ${isBroken ? 'text-accent-tomato' : 'text-primary'}`}>
            {isBroken ? '故障中' : '正常稼働'}
          </span>
          {!editingComment && comment && (
            <p className="text-xs text-ink-mute mt-0.5 truncate max-w-xs">{comment}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit && (
            <>
              <button
                onClick={toggleStatus}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border transition disabled:opacity-50 ${
                  isBroken
                    ? 'border-primary/30 bg-canvas-soft text-primary hover:bg-canvas'
                    : 'border-accent-tomato/30 bg-[#fff3f0] text-accent-tomato hover:bg-canvas'
                }`}
              >
                {isBroken ? (
                  <><CheckCircle className="h-3.5 w-3.5" />正常に戻す</>
                ) : (
                  <><AlertTriangle className="h-3.5 w-3.5" />故障中にする</>
                )}
              </button>

              <button
                onClick={() => { setDraftComment(comment); setEditingComment(!editingComment) }}
                disabled={isPending}
                title="コメントを編集"
                className="p-1.5 rounded-sm text-ink-mute hover:text-ink hover:bg-canvas-soft transition disabled:opacity-50"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              title="削除"
              className="p-1.5 rounded-sm text-ink-mute hover:text-accent-tomato hover:bg-[#fff3f0] transition disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {editingComment && (
        <div className="px-4 pb-4 pt-0 flex items-center gap-2">
          <input
            type="text"
            value={draftComment}
            onChange={(e) => setDraftComment(e.target.value)}
            placeholder="コメントを入力（例：ドア故障中）"
            className="flex-1 px-3 py-1.5 text-sm border border-hairline rounded-sm focus:outline-none focus:border-ink-mute-2 transition"
          />
          <button
            onClick={saveComment}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium bg-primary text-on-primary rounded-sm hover:bg-primary-deep disabled:opacity-50 transition"
          >
            保存
          </button>
          <button
            onClick={() => { setEditingComment(false); setDraftComment(comment) }}
            className="px-3 py-1.5 text-xs text-ink-mute hover:text-ink rounded-sm hover:bg-canvas-soft transition"
          >
            取消
          </button>
        </div>
      )}

      {error && (
        <p className="mx-4 mb-4 text-xs text-accent-tomato bg-[#fff3f0] border border-accent-tomato/30 rounded px-2 py-1">
          {error}
        </p>
      )}
    </div>
  )
}

export default function MachineList({ machines, isAdmin, canEdit }: MachineListProps) {
  if (machines.length === 0) {
    return (
      <div className="text-center py-12 text-ink-faint">
        <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">機器がまだ登録されていません。</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {machines.map((machine) => (
        <MachineRow key={machine.id} machine={machine} isAdmin={isAdmin} canEdit={canEdit} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: AddMachineForm.tsx を修正する**

ファイルを読み、共通テーブルに従って:
- ボタン: `bg-indigo-600 text-white rounded-lg` → `bg-primary text-on-primary rounded-sm`
- インプット: `border-gray-300 focus:ring-indigo-500` → `border-hairline focus:border-ink-mute-2 focus:outline-none`
- ラベル: `text-gray-700` → `text-ink-mute`

- [ ] **Step 3: ビルドを確認する**

```bash
npm run build
```

- [ ] **Step 4: コミットする**

```bash
git add src/components/machines/
git commit -m "feat: 機器コンポーネントをリデザイン"
```

---

## Task 12: 在庫・メンバー・その他ページをリデザインする

**Files:**
- Modify: `src/app/dashboard/inventory/page.tsx`
- Modify: `src/app/dashboard/members/page.tsx`
- Modify: `src/app/dashboard/analytics/page.tsx`
- Modify: `src/app/dashboard/logs/page.tsx`
- Modify: `src/app/dashboard/profile/page.tsx`
- Modify: `src/components/inventory/InventoryMatrix.tsx`
- Modify: `src/components/inventory/InventoryTypeManager.tsx`
- Modify: `src/components/inventory/StoreInventoryEditor.tsx`
- Modify: `src/components/members/MemberList.tsx`
- Modify: `src/components/members/InviteForm.tsx`
- Modify: `src/components/analytics/PeriodSelector.tsx`
- Modify: `src/components/analytics/MonthlyChart.tsx`
- Modify: `src/components/analytics/StoreComparisonChart.tsx`
- Modify: `src/components/logs/ActionLog.tsx`

- [ ] **Step 1: 各ファイルを読み、共通テーブルに従って一括置換する**

全ファイルに共通して適用するルール（共通テーブル参照）:

**在庫コンポーネント (Inventory*):**
- 数値入力フィールド: `border-gray-300 focus:ring-indigo-500` → `border-hairline focus:border-ink-mute-2 focus:outline-none`
- 在庫数が低い場合のハイライト: `text-red-*` → `text-accent-tomato`
- 保存ボタン: `bg-indigo-600` → `bg-primary text-on-primary rounded-sm`

**メンバーコンポーネント (Member*):**
- 招待ボタン: `bg-indigo-600` → `bg-primary text-on-primary rounded-sm`
- ロールバッジ: `bg-indigo-100 text-indigo-700` → `bg-canvas-soft text-ink-mute`
- テーブル: `bg-gray-50` → `bg-canvas-soft`, `border-gray-200` → `border-hairline`

**ログ (ActionLog):**
- `bg-gray-50` → `bg-canvas-soft`
- `text-gray-*` → 対応するink-*
- ログエントリのボーダー: `border-gray-100` → `border-hairline`

**プロフィール:**
- フォーム: ログインページと同じパターン

**アナリティクス:**
- グラフの色: `#6366f1` (indigo) → `#3ecf8e` (primary) に変更
- ただし recharts の `stroke` / `fill` propは直接変更する（Tailwindクラスでなく）

- [ ] **Step 2: ビルドを確認する**

```bash
npm run build
```

- [ ] **Step 3: コミットする**

```bash
git add src/app/dashboard/inventory/ src/app/dashboard/members/ src/app/dashboard/analytics/ src/app/dashboard/logs/ src/app/dashboard/profile/ src/components/inventory/ src/components/members/ src/components/analytics/ src/components/logs/
git commit -m "feat: 在庫・メンバー・その他ページをリデザイン"
```

---

## Task 13: 最終ビルド確認 + 目視確認

- [ ] **Step 1: フルビルドを確認する**

```bash
npm run build
```

期待: ビルドエラーなし。

- [ ] **Step 2: Lintを確認する**

```bash
npm run lint
```

期待: ESLintエラーなし。

- [ ] **Step 3: 開発サーバーを起動して目視確認する**

```bash
npm run dev
```

以下のページを確認:
1. `http://localhost:3000/auth/login` — 白背景、エメラルドボタン、ダークテキスト
2. `http://localhost:3000/dashboard` — 白サイドバー、エメラルドアクセント
3. 任意の店舗ページ — カード・ボタン・インプットがトークンに準拠

チェックリスト:
- [ ] エメラルドボタン (`bg-primary`) のテキストがダーク (`text-on-primary`)
- [ ] 背景グラデーションが存在しない
- [ ] サイドバーが白 (`bg-canvas`)、アクティブ項目に左ボーダー
- [ ] ボタンの角丸が控えめ (6px)
- [ ] フォントがInterに変わっている

- [ ] **Step 4: 最終コミット**

```bash
git add -A
git commit -m "feat: Supabaze Inspired デザインシステム移行完了"
```
