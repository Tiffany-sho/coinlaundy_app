'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle, Wrench, MessageSquare, Trash2 } from 'lucide-react'
import type { Machine } from '@/types/database'
import {
  updateMachineStatusAction,
  deleteMachineAction,
} from '@/app/dashboard/stores/[id]/machines/actions'

interface MachineListProps {
  machines: Machine[]
  isAdmin: boolean
  canEdit: boolean // admin or collecter
}

interface MachineRowProps {
  machine: Machine
  isAdmin: boolean
  canEdit: boolean
}

function MachineRow({ machine, isAdmin, canEdit }: MachineRowProps) {
  const [isBroken, setIsBroken] = useState(machine.is_broken)
  const [comment, setComment] = useState(machine.comment ?? '')
  const [editingComment, setEditingComment] = useState(false)
  const [draftComment, setDraftComment] = useState(machine.comment ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggleStatus() {
    const newStatus = !isBroken
    setIsBroken(newStatus)
    setError(null)
    startTransition(async () => {
      const result = await updateMachineStatusAction(machine.id, newStatus, comment)
      if (result?.error) {
        setIsBroken(!newStatus) // revert
        setError(result.error)
      }
    })
  }

  function saveComment() {
    setError(null)
    startTransition(async () => {
      const result = await updateMachineStatusAction(machine.id, isBroken, draftComment)
      if (result?.error) {
        setError(result.error)
      } else {
        setComment(draftComment)
        setEditingComment(false)
      }
    })
  }

  function handleDelete() {
    if (!confirm(`「${machine.name}」を削除しますか？この操作は取り消せません。`)) return
    startTransition(async () => {
      const result = await deleteMachineAction(machine.id)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isBroken ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: name + unit count + status */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Wrench
            className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isBroken ? 'text-red-400' : 'text-gray-400'}`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">{machine.name}</span>
              <span className="text-xs text-gray-400">×{machine.unit_count}台</span>
              {isBroken ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  故障中
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  正常
                </span>
              )}
            </div>

            {/* Comment display */}
            {!editingComment && comment && (
              <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{comment}</p>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit && (
            <>
              {/* Toggle broken status */}
              <button
                onClick={toggleStatus}
                disabled={isPending}
                title={isBroken ? '正常に戻す' : '故障中にする'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-50 ${
                  isBroken
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                {isBroken ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    正常に戻す
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    故障中
                  </>
                )}
              </button>

              {/* Comment edit toggle */}
              <button
                onClick={() => {
                  setDraftComment(comment)
                  setEditingComment(!editingComment)
                }}
                disabled={isPending}
                title="コメントを編集"
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-50"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              title="削除"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Inline comment editor */}
      {editingComment && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={draftComment}
            onChange={(e) => setDraftComment(e.target.value)}
            placeholder="コメントを入力（任意）"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
          <button
            onClick={saveComment}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            保存
          </button>
          <button
            onClick={() => {
              setEditingComment(false)
              setDraftComment(comment)
            }}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            取消
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
          {error}
        </p>
      )}
    </div>
  )
}

export default function MachineList({ machines, isAdmin, canEdit }: MachineListProps) {
  if (machines.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">機器がまだ登録されていません。</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {machines.map((machine) => (
        <MachineRow
          key={machine.id}
          machine={machine}
          isAdmin={isAdmin}
          canEdit={canEdit}
        />
      ))}
    </div>
  )
}
