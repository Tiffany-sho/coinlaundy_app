'use client'

import { useState, useTransition, useRef } from 'react'
import { AlertCircle, User, Building2, ChevronRight, ChevronLeft, Info } from 'lucide-react'
import { setupProfileAction } from './actions'

type Role = 'admin' | 'collecter' | 'viewer'

export default function SetupForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role | null>(null)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const isNonAdminRole = role === 'collecter' || role === 'viewer'

  function handleNext() {
    if (!fullName.trim()) {
      setError('氏名を入力してください。')
      return
    }
    if (!role) {
      setError('役割を選択してください。')
      return
    }
    setError(null)
    setStep(2)
  }

  function handleBack() {
    setError(null)
    setStep(1)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    // Inject step-1 values
    formData.set('full_name', fullName)
    formData.set('username', username)
    formData.set('role', role ?? '')
    // Convert checkbox to boolean string
    const trackRaw = formData.get('track_denominations_raw')
    formData.set('track_denominations', trackRaw === 'on' ? 'true' : 'false')
    formData.delete('track_denominations_raw')

    startTransition(async () => {
      const result = await setupProfileAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <StepBadge active={step === 1} done={step === 2} label="1" />
          <div className="h-px flex-1 bg-gray-200" />
          <StepBadge active={step === 2} done={false} label="2" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mt-4">
          {step === 1 ? 'プロフィール設定' : '組織の作成'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {step === 1
            ? 'あなたの基本情報と役割を設定してください。'
            : '管理する組織の情報を入力してください。'}
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Step 1 ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              氏名 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="full_name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="山田 太郎"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              ユーザー名{' '}
              <span className="text-gray-400 text-xs">(任意)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                @
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yamada_taro"
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              役割 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <RoleCard
                value="admin"
                selected={role === 'admin'}
                onChange={() => setRole('admin')}
                title="管理者 (Admin)"
                description="組織を作成・管理する"
              />
              <RoleCard
                value="collecter"
                selected={role === 'collecter'}
                onChange={() => setRole('collecter')}
                title="集金担当者 (Collecter)"
                description="集金記録を入力する"
                badge="※招待が必要"
              />
              <RoleCard
                value="viewer"
                selected={role === 'viewer'}
                onChange={() => setRole('viewer')}
                title="閲覧者 (Viewer)"
                description="データを閲覧する"
                badge="※招待が必要"
              />
            </div>
          </div>

          {/* Info box for non-admin roles */}
          {isNonAdminRole && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                集金担当者・閲覧者は管理者からの招待が必要です。招待メールをお待ちください。
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={!role || isNonAdminRole}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            次へ
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Step 2 (admin only) ─────────────────────────────── */}
      {step === 2 && (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          {/* Org Name */}
          <div>
            <label htmlFor="org_name" className="block text-sm font-medium text-gray-700 mb-1">
              組織名 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="org_name"
                name="org_name"
                type="text"
                required
                placeholder="株式会社コインランドリー"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Collect Method */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">
              集金入力方法
            </legend>
            <div className="space-y-2">
              <MethodCard
                name="collect_method"
                value="machines"
                defaultChecked
                title="機器別に入力"
                description="各機器ごとに集金額を記録する"
              />
              <MethodCard
                name="collect_method"
                value="total"
                title="合計のみ入力"
                description="店舗全体の合計金額のみ記録する"
              />
            </div>
          </fieldset>

          {/* Track Denominations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              金種別記録
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition">
              <input
                type="checkbox"
                name="track_denominations_raw"
                className="h-4 w-4 rounded accent-indigo-600"
              />
              <div>
                <div className="text-sm font-medium text-gray-800">金種別に記録する</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  10円・50円・100円・500円・1000円ごとに記録
                </div>
              </div>
            </label>
          </div>

          {/* Collection Cycle */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">
              集金サイクル
            </legend>
            <div className="flex gap-3">
              <CycleCard name="collection_cycle" value="weekly" label="週次" defaultChecked />
              <CycleCard name="collection_cycle" value="monthly" label="月次" />
            </div>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <ChevronLeft className="h-4 w-4" />
              戻る
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isPending ? 'セットアップ中...' : 'セットアップ完了'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────

function StepBadge({
  active,
  done,
  label,
}: {
  active: boolean
  done: boolean
  label: string
}) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
        active
          ? 'bg-indigo-600 text-white'
          : done
          ? 'bg-indigo-200 text-indigo-700'
          : 'bg-gray-100 text-gray-400'
      }`}
    >
      {label}
    </div>
  )
}

function RoleCard({
  value,
  selected,
  onChange,
  title,
  description,
  badge,
}: {
  value: string
  selected: boolean
  onChange: () => void
  title: string
  description: string
  badge?: string
}) {
  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
        selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <input
        type="radio"
        name="role_display"
        value={value}
        checked={selected}
        onChange={onChange}
        className="mt-0.5 accent-indigo-600"
      />
      <div>
        <div className="text-sm font-semibold text-gray-800">
          {title}
          {badge && (
            <span className="ml-2 text-xs font-normal text-amber-600">{badge}</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </div>
    </label>
  )
}

function MethodCard({
  name,
  value,
  defaultChecked,
  title,
  description,
}: {
  name: string
  value: string
  defaultChecked?: boolean
  title: string
  description: string
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 accent-indigo-600"
      />
      <div>
        <div className="text-sm font-medium text-gray-800">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </label>
  )
}

function CycleCard({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string
  value: string
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex-1 flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="accent-indigo-600"
      />
      <span className="text-sm font-medium text-gray-800">{label}</span>
    </label>
  )
}
