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
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-teal-50 text-teal-700 border border-teal-200'
              : 'bg-red-50 text-red-700 border border-red-200'
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
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-900">基本情報</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold flex-shrink-0">
              {(profile.full_name ?? profile.username ?? 'U').charAt(0)}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700">
                <Camera className="h-4 w-4" />
                アバターを変更（近日対応予定）
              </label>
              <p className="text-xs text-gray-400 mt-0.5">JPG、PNG形式 最大2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-xs font-medium text-gray-600 mb-1">
                氏名
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={profile.full_name ?? ''}
                placeholder="山田 太郎"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-gray-600 mb-1">
                ユーザー名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                defaultValue={profile.username ?? ''}
                placeholder="yamada_taro"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              メールアドレス（変更不可）
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* Section: Contact */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Phone className="h-4 w-4 text-teal-500" />
          <h2 className="text-sm font-semibold text-gray-900">連絡先</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="phone_number" className="block text-xs font-medium text-gray-600 mb-1">
              電話番号
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              defaultValue={profile.phone_number ?? ''}
              placeholder="090-0000-0000"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="notification_email" className="block text-xs font-medium text-gray-600 mb-1">
              通知メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="notification_email"
                name="notification_email"
                type="email"
                defaultValue={profile.notification_email ?? ''}
                placeholder="通知を受け取るメールアドレス"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Collection Settings */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Settings className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-900">集金設定</h2>
        </div>
        <div className="px-6 py-5 space-y-6">
          {/* collect_method */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">集金方法</p>
            <div className="flex flex-col sm:flex-row gap-3">
              {[
                { value: 'machines', label: '機器別', desc: '機器ごとに金額を記録します' },
                { value: 'total', label: '合計のみ', desc: '店舗ごとの合計金額のみ記録します' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex-1 flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
                >
                  <input
                    type="radio"
                    name="collect_method"
                    value={opt.value}
                    defaultChecked={profile.collect_method === opt.value}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* track_denominations toggle */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">金種別に記録する</p>
              <p className="text-xs text-gray-500 mt-0.5">
                集金時に1万円・5千円・千円・百円・50円・10円別に入力します
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={trackDenominations}
              onClick={() => setTrackDenominations((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                trackDenominations ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  trackDenominations ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* collection_cycle */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-600 mb-2">集金サイクル</p>
            <div className="flex gap-3">
              {[
                { value: 'weekly', label: '毎週' },
                { value: 'monthly', label: '毎月' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
                >
                  <input
                    type="radio"
                    name="collection_cycle"
                    value={opt.value}
                    defaultChecked={profile.collection_cycle === opt.value}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-900">{opt.label}</span>
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
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition"
        >
          {isPending ? '保存中...' : '変更を保存'}
        </button>
      </div>
    </form>
  )
}
