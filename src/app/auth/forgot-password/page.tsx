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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">メールを送信しました</h2>
        <p className="text-sm text-gray-600 mb-6">
          パスワードリセット用のメールを送信しました。
          <br />
          メールをご確認の上、リンクをクリックしてパスワードを再設定してください。
        </p>
        <Link
          href="/auth/login"
          className="text-indigo-600 font-medium hover:text-indigo-800 transition text-sm"
        >
          ログインページへ戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">パスワードをリセット</h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        登録済みのメールアドレスを入力してください。
        <br />
        パスワードリセット用のリンクをお送りします。
      </p>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Send className="h-4 w-4" />
          {isPending ? '送信中...' : 'リセットメールを送信'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/auth/login" className="text-indigo-600 font-medium hover:text-indigo-800 transition">
          ログインページへ戻る
        </Link>
      </p>
    </div>
  )
}
