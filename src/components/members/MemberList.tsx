'use client'

import { useState, useTransition } from 'react'
import { updateMemberRoleAction, removeMemberAction } from '@/app/dashboard/members/actions'
import { Trash2, ChevronDown } from 'lucide-react'

type Role = 'admin' | 'collecter' | 'viewer'

interface Member {
  id: string
  user_id: string
  role: Role
  joined_at: string
  email: string
  full_name: string | null
  username: string | null
  is_owner: boolean
}

interface Props {
  members: Member[]
  currentUserId: string
  orgOwnerId: string
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

export default function MemberList({ members, currentUserId, orgOwnerId }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRoleChange(memberId: string, newRole: string) {
    setError(null)
    startTransition(async () => {
      const result = await updateMemberRoleAction(memberId, newRole)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  function handleRemove(memberId: string, displayName: string) {
    if (!confirm(`${displayName} をメンバーから削除しますか？`)) return
    setError(null)
    startTransition(async () => {
      const result = await removeMemberAction(memberId)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                メンバー
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                役割
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                参加日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member) => {
              const displayName = member.full_name ?? member.username ?? member.email
              const initials = displayName.charAt(0).toUpperCase()
              const isSelf = member.user_id === currentUserId
              const isOwner = member.user_id === orgOwnerId

              return (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                          {displayName}
                          {isSelf && (
                            <span className="text-xs text-gray-400 font-normal">(自分)</span>
                          )}
                          {isOwner && (
                            <span className="text-xs text-amber-600 font-medium">オーナー</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{member.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {isSelf ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleBadgeColors[member.role]}`}>
                        {roleLabels[member.role]}
                      </span>
                    ) : (
                      <div className="relative inline-flex items-center">
                        <select
                          defaultValue={member.role}
                          disabled={isPending}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className={`appearance-none pr-7 pl-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${roleBadgeColors[member.role]} disabled:opacity-60`}
                        >
                          <option value="admin">管理者</option>
                          <option value="collecter">集金担当</option>
                          <option value="viewer">閲覧者</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-current opacity-70" />
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(member.joined_at).toLocaleDateString('ja-JP')}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {!isSelf && !isOwner && (
                      <button
                        onClick={() => handleRemove(member.id, displayName)}
                        disabled={isPending}
                        title="メンバーを削除"
                        className="text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
