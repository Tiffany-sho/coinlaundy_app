'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Package, Pencil, Check, X } from 'lucide-react'
import {
  addInventoryTypeAction,
  deleteInventoryTypeAction,
  updateInventoryTypeAction,
} from '@/app/dashboard/inventory/actions'
import type { InventoryType } from '@/types/database'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Props {
  inventoryTypes: InventoryType[]
}

interface EditState {
  name: string
  unit: string
  alert_threshold: number
}

export default function InventoryTypeManager({ inventoryTypes }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', unit: '', alert_threshold: 2 })
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  function handleAdd(formData: FormData) {
    setFormError(null)
    startTransition(async () => {
      const result = await addInventoryTypeAction(formData)
      if (result.error) {
        setFormError(result.error)
      } else {
        setShowForm(false)
      }
    })
  }

  function startEdit(type: InventoryType) {
    setEditingId(type.id)
    setEditState({
      name: type.name,
      unit: type.unit ?? '',
      alert_threshold: type.alert_threshold ?? 2,
    })
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError(null)
  }

  function handleUpdate() {
    if (!editingId) return
    if (!editState.name.trim()) {
      setEditError('種別名を入力してください。')
      return
    }
    setEditError(null)
    startTransition(async () => {
      const result = await updateInventoryTypeAction(editingId, {
        name: editState.name,
        unit: editState.unit,
        alert_threshold: editState.alert_threshold,
      })
      if (result.error) {
        setEditError(result.error)
      } else {
        setEditingId(null)
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    setDeleteError(null)
    setDeleteTarget(null)
    startTransition(async () => {
      const result = await deleteInventoryTypeAction(deleteTarget.id)
      if (result.error) setDeleteError(result.error)
    })
  }

  return (
    <div className="bg-canvas rounded-lg border border-hairline p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-ink flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          在庫種別管理
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary hover:bg-primary-deep text-on-primary rounded-sm transition"
        >
          <Plus className="h-4 w-4" />
          追加
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form action={handleAdd} className="mb-4 p-4 bg-canvas-soft rounded-md border border-hairline">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">
                種別名 <span className="text-accent-tomato">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="例: 洗剤"
                className="w-full px-3 py-2 text-sm border border-hairline rounded-sm focus:outline-none focus:border-ink-mute-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">単位</label>
              <input
                name="unit"
                type="text"
                placeholder="例: 袋"
                className="w-full px-3 py-2 text-sm border border-hairline rounded-sm focus:outline-none focus:border-ink-mute-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-mute mb-1">アラート閾値</label>
              <input
                name="alert_threshold"
                type="number"
                min={0}
                defaultValue={2}
                className="w-full px-3 py-2 text-sm border border-hairline rounded-sm focus:outline-none focus:border-ink-mute-2"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-accent-tomato mb-3">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-deep text-on-primary rounded-sm transition disabled:opacity-60"
            >
              {isPending ? '追加中...' : '追加する'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(null) }}
              className="px-4 py-2 text-sm font-medium text-ink-mute bg-canvas border border-hairline hover:bg-canvas-soft rounded-sm transition"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {deleteError && <p className="text-sm text-accent-tomato mb-3">{deleteError}</p>}

      {/* List */}
      {inventoryTypes.length === 0 ? (
        <p className="text-sm text-ink-faint py-4 text-center">在庫種別が登録されていません。</p>
      ) : (
        <div className="divide-y divide-hairline">
          {inventoryTypes.map((type) => (
            <div key={type.id} className="py-3">
              {editingId === type.id ? (
                /* Edit row */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-ink-mute mb-1">種別名</label>
                      <input
                        type="text"
                        value={editState.name}
                        onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm border border-hairline rounded-sm focus:outline-none focus:border-ink-mute-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-mute mb-1">単位</label>
                      <input
                        type="text"
                        value={editState.unit}
                        onChange={(e) => setEditState((s) => ({ ...s, unit: e.target.value }))}
                        placeholder="袋・本・個 など"
                        className="w-full px-3 py-1.5 text-sm border border-hairline rounded-sm focus:outline-none focus:border-ink-mute-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-mute mb-1">アラート閾値</label>
                      <input
                        type="number"
                        min={0}
                        value={editState.alert_threshold}
                        onChange={(e) =>
                          setEditState((s) => ({ ...s, alert_threshold: parseInt(e.target.value, 10) || 0 }))
                        }
                        className="w-full px-3 py-1.5 text-sm border border-hairline rounded-sm focus:outline-none focus:border-ink-mute-2"
                      />
                    </div>
                  </div>
                  {editError && <p className="text-xs text-accent-tomato">{editError}</p>}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary-deep text-on-primary rounded-sm transition disabled:opacity-60"
                    >
                      <Check className="h-3.5 w-3.5" />
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink-mute bg-canvas border border-hairline hover:bg-canvas-soft rounded-sm transition"
                    >
                      <X className="h-3.5 w-3.5" />
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                /* Display row */
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-ink">{type.name}</span>
                    <span className="ml-2 text-xs text-ink-mute">
                      単位: {type.unit ?? '—'}
                    </span>
                    <span className="ml-2 text-xs text-ink-faint">
                      アラート: {type.alert_threshold ?? 2}以下
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(type)}
                      disabled={isPending}
                      className="p-1.5 text-ink-mute hover:text-primary hover:bg-canvas-soft rounded-sm transition disabled:opacity-40"
                      aria-label={`${type.name}を編集`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: type.id, name: type.name })}
                      disabled={isPending}
                      className="p-1.5 text-ink-mute hover:text-accent-tomato hover:bg-[#fff3f0] rounded-sm transition disabled:opacity-40"
                      aria-label={`${type.name}を削除`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`「${deleteTarget?.name ?? ''}」を削除`}
        message="関連する全店舗の在庫データも削除されます。この操作は取り消せません。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isPending={isPending}
      />
    </div>
  )
}
