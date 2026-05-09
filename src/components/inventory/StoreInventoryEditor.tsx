'use client'

import { useState, useTransition } from 'react'
import { Minus, Plus, Save, CheckCircle, Loader2, Package } from 'lucide-react'
import { bulkUpdateInventoryAction } from '@/app/dashboard/inventory/actions'
import type { InventoryType, LaundryInventory } from '@/types/database'

interface InventoryWithType extends LaundryInventory {
  inventory_types: InventoryType | null
}

interface Props {
  inventory: InventoryWithType[]
  canEdit: boolean
}

export default function StoreInventoryEditor({ inventory, canEdit }: Props) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const inv of inventory) {
      init[inv.id] = inv.quantity
    }
    return init
  })

  const [savedValues, setSavedValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const inv of inventory) {
      init[inv.id] = inv.quantity
    }
    return init
  })

  const [isSaving, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const dirtyIds = Object.keys(values).filter((id) => values[id] !== savedValues[id])
  const isDirty = dirtyIds.length > 0

  function handleChange(inventoryId: string, newValue: number) {
    if (newValue < 0) return
    setSaveSuccess(false)
    setValues((prev) => ({ ...prev, [inventoryId]: newValue }))
  }

  function handleSave() {
    if (!isDirty || isSaving) return
    setSaveError(null)
    setSaveSuccess(false)

    const updates = dirtyIds.map((id) => ({ inventoryId: id, quantity: values[id] }))

    startTransition(async () => {
      const result = await bulkUpdateInventoryAction(updates)
      if (result.error) {
        setSaveError(result.error)
      } else {
        setSavedValues((prev) => {
          const next = { ...prev }
          updates.forEach(({ inventoryId, quantity }) => {
            next[inventoryId] = quantity
          })
          return next
        })
        setSaveSuccess(true)
      }
    })
  }

  if (inventory.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <Package className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">在庫種別が登録されていません。</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 rounded-t-xl overflow-hidden">
        {inventory.map((inv) => {
          const type = inv.inventory_types
          const threshold = type?.alert_threshold ?? 2
          const currentValue = values[inv.id] ?? inv.quantity
          const isCritical = currentValue === 0
          const isLow = currentValue < threshold
          const isDirtyCell = currentValue !== savedValues[inv.id]

          return (
            <div
              key={inv.id}
              className={`p-4 flex items-center justify-between gap-4 bg-white ${
                isCritical ? 'bg-red-50' : isLow ? 'bg-amber-50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {type?.name ?? '不明'}
                  </span>
                  {isCritical && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      在庫切れ
                    </span>
                  )}
                  {!isCritical && isLow && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      在庫少
                    </span>
                  )}
                  {isDirtyCell && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                      変更中
                    </span>
                  )}
                </div>
                {type?.unit && (
                  <span className="text-xs text-gray-400">{type.unit}</span>
                )}
              </div>

              {canEdit ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleChange(inv.id, currentValue - 1)}
                    disabled={currentValue <= 0 || isSaving}
                    className="h-8 w-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    aria-label="減らす"
                  >
                    <Minus className="h-3.5 w-3.5 text-gray-600" />
                  </button>

                  <input
                    type="number"
                    min={0}
                    value={currentValue}
                    onChange={(e) => handleChange(inv.id, parseInt(e.target.value, 10) || 0)}
                    disabled={isSaving}
                    className={`w-14 text-center text-base font-bold rounded-lg border py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 ${
                      isCritical
                        ? 'border-red-300 text-red-700 bg-red-50'
                        : isLow
                        ? 'border-amber-300 text-amber-700 bg-amber-50'
                        : isDirtyCell
                        ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                        : 'border-gray-200 text-gray-900 bg-white'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => handleChange(inv.id, currentValue + 1)}
                    disabled={isSaving}
                    className="h-8 w-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    aria-label="増やす"
                  >
                    <Plus className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <span
                  className={`text-xl font-bold flex-shrink-0 ${
                    isCritical
                      ? 'text-red-600'
                      : isLow
                      ? 'text-amber-600'
                      : 'text-gray-900'
                  }`}
                >
                  {currentValue}
                  {type?.unit && (
                    <span className="text-sm font-normal text-gray-500 ml-1">{type.unit}</span>
                  )}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {canEdit && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-gray-500">
            {isDirty ? (
              <span className="text-indigo-600 font-medium">{dirtyIds.length}件の変更があります</span>
            ) : (
              <span>変更なし</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                更新しました
              </span>
            )}
            {saveError && (
              <span className="text-xs text-red-600">{saveError}</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? '更新中...' : '在庫を更新する'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
