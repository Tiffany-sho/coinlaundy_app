'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle, Wrench, MessageSquare, Trash2, Loader2 } from 'lucide-react'
import type { Machine } from '@/types/database'
import {
  updateMachineStatusAction,
  deleteMachineAction,
} from '@/app/dashboard/stores/[id]/machines/actions'

interface MachineListProps {
  machines: Machine[]
  isAdmin: boolean
  canEdit: boolean
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
      if (result?.error) { setIsBroken(!newStatus); setError(result.error) }
    })
  }

  function saveComment() {
    setError(null)
    startTransition(async () => {
      const result = await updateMachineStatusAction(machine.id, isBroken, draftComment)
      if (result?.error) setError(result.error)
      else { setComment(draftComment); setEditingComment(false) }
    })
  }

  function handleDelete() {
    if (!confirm(`「${machine.name}」を削除しますか？この操作は取り消せません。`)) return
    startTransition(async () => {
      const result = await deleteMachineAction(machine.id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div
      className={`rounded-lg border transition-all ${
        isBroken ? 'border-accent-tomato/30 bg-[#fff3f0]' : 'border-hairline bg-canvas'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 p-4">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isBroken ? 'bg-[#ffece8]' : 'bg-canvas-soft'
          }`}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin text-ink-mute" />
          ) : isBroken ? (
            <AlertTriangle className="h-5 w-5 text-accent-tomato" />
          ) : (
            <CheckCircle className="h-5 w-5 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">{machine.name}</span>
            <span className="text-xs text-ink-mute bg-canvas-soft px-1.5 py-0.5 rounded">
              ×{machine.unit_count}台
            </span>
          </div>
          <span className={`text-xs font-medium ${isBroken ? 'text-accent-tomato' : 'text-primary'}`}>
            {isBroken ? '故障中' : '正常稼働'}
          </span>
          {!editingComment && comment && (
            <p className="text-xs text-ink-mute mt-0.5 truncate max-w-xs">{comment}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit && (
            <>
              <button
                onClick={toggleStatus}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border transition disabled:opacity-50 ${
                  isBroken
                    ? 'border-primary/30 bg-canvas-soft text-primary hover:bg-canvas'
                    : 'border-accent-tomato/30 bg-[#fff3f0] text-accent-tomato hover:bg-canvas'
                }`}
              >
                {isBroken ? (
                  <><CheckCircle className="h-3.5 w-3.5" />正常に戻す</>
                ) : (
                  <><AlertTriangle className="h-3.5 w-3.5" />故障中にする</>
                )}
              </button>

              <button
                onClick={() => { setDraftComment(comment); setEditingComment(!editingComment) }}
                disabled={isPending}
                title="コメントを編集"
                className="p-1.5 rounded-sm text-ink-mute hover:text-ink hover:bg-canvas-soft transition disabled:opacity-50"
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
              className="p-1.5 rounded-sm text-ink-mute hover:text-accent-tomato hover:bg-[#fff3f0] transition disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {editingComment && (
        <div className="px-4 pb-4 pt-0 flex items-center gap-2">
          <input
            type="text"
            value={draftComment}
            onChange={(e) => setDraftComment(e.target.value)}
            placeholder="コメントを入力（例：ドア故障中）"
            className="flex-1 px-3 py-1.5 text-sm border border-hairline rounded-sm focus:outline-none focus:border-ink-mute-2 transition"
          />
          <button
            onClick={saveComment}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium bg-primary text-on-primary rounded-sm hover:bg-primary-deep disabled:opacity-50 transition"
          >
            保存
          </button>
          <button
            onClick={() => { setEditingComment(false); setDraftComment(comment) }}
            className="px-3 py-1.5 text-xs text-ink-mute hover:text-ink rounded-sm hover:bg-canvas-soft transition"
          >
            取消
          </button>
        </div>
      )}

      {error && (
        <p className="mx-4 mb-4 text-xs text-accent-tomato bg-[#fff3f0] border border-accent-tomato/30 rounded px-2 py-1">
          {error}
        </p>
      )}
    </div>
  )
}

export default function MachineList({ machines, isAdmin, canEdit }: MachineListProps) {
  if (machines.length === 0) {
    return (
      <div className="text-center py-12 text-ink-faint">
        <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">機器がまだ登録されていません。</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {machines.map((machine) => (
        <MachineRow key={machine.id} machine={machine} isAdmin={isAdmin} canEdit={canEdit} />
      ))}
    </div>
  )
}
