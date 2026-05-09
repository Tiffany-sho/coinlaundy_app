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
  admin: 'bg-canvas-soft text-ink border border-hairline',
  collecter: 'bg-canvas-soft text-primary border border-primary/20',
  viewer: 'bg-canvas-soft text-ink-mute border border-hairline',
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
        <div className="mb-4 rounded-md bg-[#fff3f0] border border-accent-tomato/30 px-4 py-3 text-sm text-accent-tomato">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
        <table className="min-w-full divide-y divide-hairline">
          <thead className="bg-canvas-soft">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider">
                メンバー
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider">
                役割
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider">
                参加日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-ink-mute uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {members.map((member) => {
              const displayName = member.full_name ?? member.username ?? member.email
              const initials = displayName.charAt(0).toUpperCase()
              const isSelf = member.user_id === currentUserId
              const isOwner = member.user_id === orgOwnerId

              return (
                <tr key={member.id} className="hover:bg-canvas-soft transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink-mute text-sm font-medium flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink truncate flex items-center gap-2">
                          {displayName}
                          {isSelf && (
                            <span className="text-xs text-ink-faint font-normal">(自分)</span>
                          )}
                          {isOwner && (
                            <span className="text-xs text-accent-yellow font-medium">オーナー</span>
                          )}
                        </div>
                        <div className="text-xs text-ink-mute truncate">{member.email}</div>
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
                          className={`appearance-none pr-7 pl-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:border-ink-mute-2 ${roleBadgeColors[member.role]} disabled:opacity-60`}
                        >
                          <option value="admin">管理者</option>
                          <option value="collecter">集金担当</option>
                          <option value="viewer">閲覧者</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-current opacity-70" />
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-ink-mute">
                    {new Date(member.joined_at).toLocaleDateString('ja-JP')}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {!isSelf && !isOwner && (
                      <button
                        onClick={() => handleRemove(member.id, displayName)}
                        disabled={isPending}
                        title="メンバーを削除"
                        className="text-ink-mute hover:text-accent-tomato transition disabled:opacity-50"
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
