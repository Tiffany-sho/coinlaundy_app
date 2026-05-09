'use client'

import { useState, useTransition } from 'react'
import { Lock, KeyRound, AlertCircle } from 'lucide-react'
import { resetPasswordAction } from '@/app/auth/actions'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await resetPasswordAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="w-full max-w-md bg-canvas border border-hairline rounded-xl shadow-sm p-8">
      <h2 className="text-2xl font-medium text-ink mb-2 text-center">パスワードを更新</h2>
      <p className="text-sm text-ink-mute text-center mb-6">
        新しいパスワードを入力してください。
      </p>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg bg-[#fff3f0] border border-accent-tomato/30 px-4 py-3 text-sm text-accent-tomato">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink-mute mb-1">
            新しいパスワード
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="6文字以上"
              className="w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium text-ink-mute mb-1">
            新しいパスワード（確認）
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              required
              autoComplete="new-password"
              placeholder="パスワードを再入力"
              className="w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-deep disabled:opacity-50 text-on-primary font-medium py-2.5 px-4 rounded-sm transition"
        >
          <KeyRound className="h-4 w-4" />
          {isPending ? '更新中...' : 'パスワードを更新'}
        </button>
      </form>
    </div>
  )
}
