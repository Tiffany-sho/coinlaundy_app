'use client'

import { useState, useRef, useTransition } from 'react'
import { User, Phone, Mail, Settings, Camera, CheckCircle, AlertCircle } from 'lucide-react'
import { updateProfileAction } from './actions'
import type { Profile } from '@/types/database'

interface Props {
  profile: Profile
  email: string
}

export default function ProfileForm({ profile, email }: Props) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [trackDenominations, setTrackDenominations] = useState(profile.track_denominations)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (trackDenominations) {
      formData.set('track_denominations', 'on')
    } else {
      formData.delete('track_denominations')
    }

    startTransition(async () => {
      const result = await updateProfileAction(formData)
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'プロフィールを更新しました。' })
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium ${
            message.type === 'success'
              ? 'bg-canvas-soft text-primary border border-primary/30'
              : 'bg-[#fff3f0] text-accent-tomato border border-accent-tomato/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Section: Basic Info */}
      <section className="bg-canvas rounded-lg border border-hairline overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium text-ink">基本情報</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute text-2xl font-medium flex-shrink-0">
              {(profile.full_name ?? profile.username ?? 'U').charAt(0)}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:text-primary-deep">
                <Camera className="h-4 w-4" />
                アバターを変更（近日対応予定）
              </label>
              <p className="text-xs text-ink-faint mt-0.5">JPG、PNG形式 最大2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-xs font-medium text-ink-mute mb-1">
                氏名
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={profile.full_name ?? ''}
                placeholder="山田 太郎"
                className="w-full px-3 py-2 rounded-sm border border-hairline text-sm text-ink focus:outline-none focus:border-ink-mute-2"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-ink-mute mb-1">
                ユーザー名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                defaultValue={profile.username ?? ''}
                placeholder="yamada_taro"
                className="w-full px-3 py-2 rounded-sm border border-hairline text-sm text-ink focus:outline-none focus:border-ink-mute-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-mute mb-1">
              メールアドレス（変更不可）
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-3 py-2 rounded-sm border border-hairline bg-canvas-soft text-sm text-ink-mute cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* Section: Contact */}
      <section className="bg-canvas rounded-lg border border-hairline overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium text-ink">連絡先</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="phone_number" className="block text-xs font-medium text-ink-mute mb-1">
              電話番号
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              defaultValue={profile.phone_number ?? ''}
              placeholder="090-0000-0000"
              className="w-full px-3 py-2 rounded-sm border border-hairline text-sm text-ink focus:outline-none focus:border-ink-mute-2"
            />
          </div>
          <div>
            <label htmlFor="notification_email" className="block text-xs font-medium text-ink-mute mb-1">
              通知メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-mute" />
              <input
                id="notification_email"
                name="notification_email"
                type="email"
                defaultValue={profile.notification_email ?? ''}
                placeholder="通知を受け取るメールアドレス"
                className="w-full pl-9 pr-3 py-2 rounded-sm border border-hairline text-sm text-ink focus:outline-none focus:border-ink-mute-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Collection Settings */}
      <section className="bg-canvas rounded-lg border border-hairline overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium text-ink">集金設定</h2>
        </div>
        <div className="px-6 py-5 space-y-6">
          {/* collect_method */}
          <div>
            <p className="text-xs font-medium text-ink-mute mb-2">集金方法</p>
            <div className="flex flex-col sm:flex-row gap-3">
              {[
                { value: 'machines', label: '機器別', desc: '機器ごとに金額を記録します' },
                { value: 'total', label: '合計のみ', desc: '店舗ごとの合計金額のみ記録します' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex-1 flex items-start gap-3 p-4 rounded-md border border-hairline cursor-pointer hover:border-primary/30 hover:bg-canvas-soft transition has-[:checked]:border-primary has-[:checked]:bg-canvas-soft"
                >
                  <input
                    type="radio"
                    name="collect_method"
                    value={opt.value}
                    defaultChecked={profile.collect_method === opt.value}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-ink">{opt.label}</span>
                    <p className="text-xs text-ink-mute mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* track_denominations toggle */}
          <div className="flex items-center justify-between py-3 border-t border-hairline">
            <div>
              <p className="text-sm font-medium text-ink">金種別に記録する</p>
              <p className="text-xs text-ink-mute mt-0.5">
                集金時に1万円・5千円・千円・百円・50円・10円別に入力します
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={trackDenominations}
              onClick={() => setTrackDenominations((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                trackDenominations ? 'bg-primary' : 'bg-canvas-soft border border-hairline-strong'
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-canvas shadow ring-0 transition duration-200 ease-in-out ${
                  trackDenominations ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* collection_cycle */}
          <div className="border-t border-hairline pt-4">
            <p className="text-xs font-medium text-ink-mute mb-2">集金サイクル</p>
            <div className="flex gap-3">
              {[
                { value: 'weekly', label: '毎週' },
                { value: 'monthly', label: '毎月' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-4 py-2 rounded-sm border border-hairline cursor-pointer hover:border-primary/30 hover:bg-canvas-soft transition has-[:checked]:border-primary has-[:checked]:bg-canvas-soft"
                >
                  <input
                    type="radio"
                    name="collection_cycle"
                    value={opt.value}
                    defaultChecked={profile.collection_cycle === opt.value}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium text-ink">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-deep disabled:opacity-60 text-on-primary text-sm font-medium px-6 py-2.5 rounded-sm transition"
        >
          {isPending ? '保存中...' : '変更を保存'}
        </button>
      </div>
    </form>
  )
}
