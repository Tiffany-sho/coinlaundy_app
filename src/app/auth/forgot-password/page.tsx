'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { forgotPasswordAction } from '@/app/auth/actions'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await forgotPasswordAction(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <div className="w-full max-w-md bg-canvas border border-hairline rounded-xl shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-medium text-ink mb-3">メールを送信しました</h2>
        <p className="text-sm text-ink-mute mb-6">
          パスワードリセット用のメールを送信しました。
          <br />
          メールをご確認の上、リンクをクリックしてパスワードを再設定してください。
        </p>
        <Link
          href="/auth/login"
          className="text-ink font-medium underline hover:text-ink-mute transition text-sm"
        >
          ログインページへ戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-canvas border border-hairline rounded-xl shadow-sm p-8">
      <h2 className="text-2xl font-medium text-ink mb-2 text-center">パスワードをリセット</h2>
      <p className="text-sm text-ink-mute text-center mb-6">
        登録済みのメールアドレスを入力してください。
        <br />
        パスワードリセット用のリンクをお送りします。
      </p>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg bg-[#fff3f0] border border-accent-tomato/30 px-4 py-3 text-sm text-accent-tomato">
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-deep disabled:opacity-50 text-on-primary font-medium py-2.5 px-4 rounded-sm transition"
        >
          <Send className="h-4 w-4" />
          {isPending ? '送信中...' : 'リセットメールを送信'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mute">
        <Link href="/auth/login" className="text-ink font-medium underline hover:text-ink-mute transition">
          ログインページへ戻る
        </Link>
      </p>
    </div>
  )
}
