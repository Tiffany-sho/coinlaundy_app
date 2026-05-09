'use client'

import { useState, useTransition } from 'react'
import { Minus, Plus } from 'lucide-react'
import { updateInventoryAction } from '@/app/dashboard/inventory/actions'
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

interface CellState {
  [inventoryId: string]: {
    value: number
    saving: boolean
    error: string | null
  }
}

export default function InventoryMatrix({ stores, inventoryTypes }: Props) {
  const [cellState, setCellState] = useState<CellState>(() => {
    const initial: CellState = {}
    for (const { inventory } of stores) {
      for (const inv of inventory) {
        initial[inv.id] = { value: inv.quantity, saving: false, error: null }
      }
    }
    return initial
  })
  const [, startTransition] = useTransition()

  function getCellValue(inventoryId: string, fallback: number): number {
    return cellState[inventoryId]?.value ?? fallback
  }

  function handleChange(inventoryId: string, newValue: number) {
    if (newValue < 0) return
    setCellState((prev) => ({
      ...prev,
      [inventoryId]: { ...prev[inventoryId], value: newValue, error: null },
    }))
  }

  function handleSave(inventoryId: string) {
    const current = cellState[inventoryId]
    if (!current) return

    setCellState((prev) => ({
      ...prev,
      [inventoryId]: { ...prev[inventoryId], saving: true, error: null },
    }))

    startTransition(async () => {
      const result = await updateInventoryAction(inventoryId, current.value)
      setCellState((prev) => ({
        ...prev,
        [inventoryId]: {
          ...prev[inventoryId],
          saving: false,
          error: result.error ?? null,
        },
      }))
    })
  }

  if (inventoryTypes.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-8 text-center">
        在庫種別が登録されていません。管理者が在庫種別を追加してください。
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-8 text-center">
        店舗が登録されていません。
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 min-w-[160px]">
              店舗
            </th>
            {inventoryTypes.map((type) => (
              <th
                key={type.id}
                className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[120px]"
              >
                <div>{type.name}</div>
                {type.unit && (
                  <div className="text-gray-400 font-normal normal-case mt-0.5">({type.unit})</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {stores.map(({ store, inventory }) => {
            return (
              <tr key={store.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-gray-900 border-r border-gray-200">
                  {store.name}
                </td>
                {inventoryTypes.map((type) => {
                  const inv = inventory.find((i) => i.inventory_type_id === type.id)
                  if (!inv) {
                    return (
                      <td key={type.id} className="px-3 py-3 text-center text-gray-300">
                        —
                      </td>
                    )
                  }

                  const state = cellState[inv.id]
                  const currentValue = state?.value ?? inv.quantity
                  const threshold = type.alert_threshold ?? 2
                  const isLow = currentValue < threshold
                  const isCritical = currentValue === 0

                  return (
                    <td
                      key={type.id}
                      className={`px-3 py-2 text-center ${
                        isCritical
                          ? 'bg-red-50 border border-red-300'
                          : isLow
                          ? 'bg-amber-50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleChange(inv.id, currentValue - 1)
                          }}
                          disabled={currentValue <= 0 || state?.saving}
                          className="flex-shrink-0 h-6 w-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          aria-label="減らす"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>

                        <input
                          type="number"
                          min={0}
                          value={currentValue}
                          onChange={(e) => handleChange(inv.id, parseInt(e.target.value, 10) || 0)}
                          onBlur={() => handleSave(inv.id)}
                          disabled={state?.saving}
                          className={`w-12 text-center text-sm font-semibold rounded border py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-60 ${
                            isCritical
                              ? 'border-red-300 text-red-700 bg-red-50'
                              : isLow
                              ? 'border-amber-300 text-amber-700 bg-amber-50'
                              : 'border-gray-200 text-gray-900 bg-white'
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            handleChange(inv.id, currentValue + 1)
                          }}
                          disabled={state?.saving}
                          className="flex-shrink-0 h-6 w-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          aria-label="増やす"
                        >
                          <Plus className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>

                      {/* Save button appears when value differs from saved */}
                      {state && state.value !== inv.quantity && !state.saving && (
                        <button
                          type="button"
                          onClick={() => handleSave(inv.id)}
                          className="mt-1 text-xs text-indigo-600 hover:underline"
                        >
                          保存
                        </button>
                      )}

                      {state?.saving && (
                        <div className="mt-1 text-xs text-gray-400">保存中...</div>
                      )}

                      {state?.error && (
                        <div className="mt-1 text-xs text-red-500">{state.error}</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
