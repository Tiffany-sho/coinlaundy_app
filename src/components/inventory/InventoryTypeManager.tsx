'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Package } from 'lucide-react'
import { addInventoryTypeAction, deleteInventoryTypeAction } from '@/app/dashboard/inventory/actions'
import type { InventoryType } from '@/types/database'

interface Props {
  inventoryTypes: InventoryType[]
}

export default function InventoryTypeManager({ inventoryTypes }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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

  function handleDelete(typeId: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？関連する全店舗の在庫データも削除されます。`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteInventoryTypeAction(typeId)
      if (result.error) {
        setDeleteError(result.error)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-teal-600" />
          在庫種別管理
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          追加
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form action={handleAdd} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                種別名 <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="例: 洗剤"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">単位</label>
              <input
                name="unit"
                type="text"
                placeholder="例: 袋"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">アラート閾値</label>
              <input
                name="alert_threshold"
                type="number"
                min={0}
                defaultValue={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-600 mb-3">{formError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-60"
            >
              {isPending ? '追加中...' : '追加する'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(null) }}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {deleteError && (
        <p className="text-sm text-red-600 mb-3">{deleteError}</p>
      )}

      {/* List */}
      {inventoryTypes.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">在庫種別が登録されていません。</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {inventoryTypes.map((type) => (
            <div key={type.id} className="flex items-center justify-between py-3 gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">{type.name}</span>
                {type.unit && (
                  <span className="ml-2 text-xs text-gray-500">単位: {type.unit}</span>
                )}
                <span className="ml-2 text-xs text-gray-400">
                  アラート: {type.alert_threshold ?? 2}以下
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(type.id, type.name)}
                disabled={isPending}
                className="flex-shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                aria-label={`${type.name}を削除`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
