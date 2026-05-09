'use client'

import { useState, useTransition } from 'react'
import { inviteMemberAction, cancelInviteAction } from '@/app/dashboard/members/actions'
import { Mail, Send, Copy, Check, X, Clock } from 'lucide-react'

type Role = 'admin' | 'collecter' | 'viewer'

interface PendingInvitation {
  id: string
  email: string
  role: Role
  expires_at: string
  created_at: string
}

interface Props {
  pendingInvitations: PendingInvitation[]
}

const roleLabels: Record<Role, string> = {
  admin: '管理者',
  collecter: '集金担当',
  viewer: '閲覧者',
}

const roleBadgeColors: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-800',
  collecter: 'bg-blue-100 text-blue-800',
  viewer: 'bg-gray-100 text-gray-600',
}

export default function InviteForm({ pendingInvitations }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [cancelError, setCancelError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setInviteLink(null)
    const formData = new FormData(event.currentTarget)
    const role = formData.get('role') as string

    startTransition(async () => {
      const result = await inviteMemberAction(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.inviteLink) {
        setInviteLink(result.inviteLink)
        ;(event.target as HTMLFormElement).reset()
      }
    })
  }

  function handleCopy() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleCancel(inviteId: string) {
    setCancelError(null)
    startTransition(async () => {
      const result = await cancelInviteAction(inviteId)
      if (result?.error) {
        setCancelError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">メンバーを招待</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="invite-email"
                name="email"
                type="email"
                required
                placeholder="recruit@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">
              役割
            </label>
            <select
              id="invite-role"
              name="role"
              defaultValue="collecter"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
            >
              <option value="collecter">集金担当</option>
              <option value="viewer">閲覧者</option>
              <option value="admin">管理者（管理権限を付与します）</option>
            </select>
            <p className="mt-1.5 text-xs text-gray-500">
              管理者は他のメンバーの管理や設定変更ができます。
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
          >
            <Send className="h-4 w-4" />
            {isPending ? '処理中...' : '招待リンクを発行'}
          </button>
        </form>

        {inviteLink && (
          <div className="mt-5 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-sm font-medium text-indigo-800 mb-2">招待リンクが発行されました</p>
            <p className="text-xs text-indigo-600 mb-3">
              以下のリンクを招待する方に共有してください（7日間有効）
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs text-gray-700 font-mono truncate focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleCopy}
                title="コピー"
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'コピー済み' : 'コピー'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">保留中の招待</h2>

          {cancelError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {cancelError}
            </div>
          )}

          <div className="space-y-3">
            {pendingInvitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 rounded-lg border border-amber-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{invite.email}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColors[invite.role]}`}>
                        {roleLabels[invite.role]}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Clock className="h-3 w-3" />
                        保留中
                      </span>
                      <span className="text-xs text-gray-500">
                        期限: {new Date(invite.expires_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(invite.id)}
                  disabled={isPending}
                  title="招待をキャンセル"
                  className="flex-shrink-0 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
