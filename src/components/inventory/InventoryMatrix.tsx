'use client'

import { useState, useTransition } from 'react'
import { Minus, Plus, Save, CheckCircle, Loader2 } from 'lucide-react'
import { bulkUpdateInventoryAction } from '@/app/dashboard/inventory/actions'
import type { InventoryType, LaundryStore, LaundryInventory } from '@/types/database'

interface InventoryWithType extends LaundryInventory {
  inventory_types: InventoryType | null
}

interface StoreInventory {
  store: LaundryStore
  inventory: InventoryWithType[]
}

interface Props {
  stores: StoreInventory[]
  inventoryTypes: InventoryType[]
}

export default function InventoryMatrix({ stores, inventoryTypes }: Props) {
  // Current edited values
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const { inventory } of stores) {
      for (const inv of inventory) {
        init[inv.id] = inv.quantity
      }
    }
    return init
  })

  // Last-saved values (for dirty detection and revert)
  const [savedValues, setSavedValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const { inventory } of stores) {
      for (const inv of inventory) {
        init[inv.id] = inv.quantity
      }
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
          updates.forEach(({ inventoryId, quantity }) => { next[inventoryId] = quantity })
          return next
        })
        setSaveSuccess(true)
      }
    })
  }

  if (inventoryTypes.length === 0) {
    return (
      <div className="text-sm text-ink-faint py-8 text-center">
        在庫種別が登録されていません。管理者が在庫種別を追加してください。
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="text-sm text-ink-faint py-8 text-center">
        店舗が登録されていません。
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-canvas-soft">
              <th className="sticky left-0 z-10 bg-canvas-soft px-4 py-3 text-left text-xs font-medium text-ink-mute uppercase tracking-wider border-b border-r border-hairline min-w-[160px]">
                店舗
              </th>
              {inventoryTypes.map((type) => (
                <th
                  key={type.id}
                  className="px-4 py-3 text-center text-xs font-medium text-ink-mute uppercase tracking-wider border-b border-hairline min-w-[130px]"
                >
                  <div>{type.name}</div>
                  {type.unit && (
                    <div className="text-ink-faint font-normal normal-case mt-0.5">({type.unit})</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {stores.map(({ store, inventory }) => (
              <tr key={store.id} className="bg-canvas hover:bg-canvas-soft/50 transition-colors">
                <td className="sticky left-0 z-10 bg-canvas px-4 py-3 font-medium text-ink border-r border-hairline">
                  {store.name}
                </td>
                {inventoryTypes.map((type) => {
                  const inv = inventory.find((i) => i.inventory_type_id === type.id)
                  if (!inv) {
                    return (
                      <td key={type.id} className="px-3 py-3 text-center text-ink-faint">—</td>
                    )
                  }

                  const currentValue = values[inv.id] ?? inv.quantity
                  const threshold = type.alert_threshold ?? 2
                  const isLow = currentValue < threshold
                  const isCritical = currentValue === 0
                  const isDirtyCell = currentValue !== savedValues[inv.id]

                  return (
                    <td
                      key={type.id}
                      className={`px-3 py-2 text-center ${
                        isCritical
                          ? 'bg-[#ffece8]'
                          : isLow
                          ? 'bg-[#fffbe0]'
                          : isDirtyCell
                          ? 'bg-canvas-soft'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleChange(inv.id, currentValue - 1)}
                          disabled={currentValue <= 0 || isSaving}
                          className="flex-shrink-0 h-6 w-6 rounded-sm flex items-center justify-center bg-canvas-soft hover:bg-canvas border border-hairline disabled:opacity-40 disabled:cursor-not-allowed transition"
                          aria-label="減らす"
                        >
                          <Minus className="h-3 w-3 text-ink-mute" />
                        </button>

                        <input
                          type="number"
                          min={0}
                          value={currentValue}
                          onChange={(e) => handleChange(inv.id, parseInt(e.target.value, 10) || 0)}
                          disabled={isSaving}
                          className={`w-12 text-center text-sm font-medium rounded-sm border py-0.5 focus:outline-none focus:border-ink-mute-2 disabled:opacity-60 ${
                            isCritical
                              ? 'border-accent-tomato/40 text-accent-tomato bg-[#ffece8]'
                              : isLow
                              ? 'border-accent-yellow/40 text-ink bg-[#fffbe0]'
                              : isDirtyCell
                              ? 'border-primary/40 text-primary bg-canvas-soft'
                              : 'border-hairline text-ink bg-canvas'
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() => handleChange(inv.id, currentValue + 1)}
                          disabled={isSaving}
                          className="flex-shrink-0 h-6 w-6 rounded-sm flex items-center justify-center bg-canvas-soft hover:bg-canvas border border-hairline disabled:opacity-40 disabled:cursor-not-allowed transition"
                          aria-label="増やす"
                        >
                          <Plus className="h-3 w-3 text-ink-mute" />
                        </button>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk save bar */}
      <div className="px-4 py-3 border-t border-hairline bg-canvas-soft flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs text-ink-mute">
          {isDirty ? (
            <span className="text-primary font-medium">{dirtyIds.length}件の変更があります</span>
          ) : (
            <span>変更なし</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <CheckCircle className="h-4 w-4" />
              更新しました
            </span>
          )}
          {saveError && (
            <span className="text-xs text-accent-tomato">{saveError}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-deep text-on-primary rounded-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
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
    </div>
  )
}
