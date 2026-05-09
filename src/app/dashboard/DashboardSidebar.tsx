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

const roleBadgeColors: Record<Role, string> = {
  admin: 'bg-indigo-500 text-white',
  collecter: 'bg-teal-500 text-white',
  viewer: 'bg-gray-400 text-white',
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
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-indigo-800">
        <Link href="/dashboard" className="block" onClick={() => setMobileOpen(false)}>
          <span className="text-2xl font-bold text-white tracking-tight">Collecie</span>
          <p className="text-xs text-indigo-300 mt-0.5">コインランドリー集金管理</p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive(item.href)
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {displayName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{displayName}</div>
            <span className={`inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadgeColors[role]}`}>
              {roleLabels[role]}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="ログアウト"
              className="text-indigo-300 hover:text-white transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 bg-indigo-900 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile: hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-900 text-white rounded-lg shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="メニューを開く"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile: overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-72 bg-indigo-900 h-full shadow-xl">
            <button
              className="absolute top-4 right-4 text-indigo-300 hover:text-white"
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
