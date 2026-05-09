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
