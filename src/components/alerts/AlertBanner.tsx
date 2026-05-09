'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Wrench, X } from 'lucide-react'

interface BrokenMachine {
  id: string
  name: string
  storeName: string
}

interface LowInventoryItem {
  id: string
  typeName: string
  storeName: string
  quantity: number
}

interface Props {
  brokenMachines: BrokenMachine[]
  lowInventoryItems: LowInventoryItem[]
}

const DISMISS_KEY_BROKEN = 'collecie_dismiss_broken_'
const DISMISS_KEY_LOW = 'collecie_dismiss_low_'

export default function AlertBanner({ brokenMachines, lowInventoryItems }: Props) {
  const [brokenDismissed, setBrokenDismissed] = useState(false)
  const [lowDismissed, setLowDismissed] = useState(false)

  // Build dismiss keys based on content fingerprint
  const brokenKey = DISMISS_KEY_BROKEN + brokenMachines.map((m) => m.id).join('_')
  const lowKey = DISMISS_KEY_LOW + lowInventoryItems.map((i) => i.id).join('_')

  useEffect(() => {
    setBrokenDismissed(localStorage.getItem(brokenKey) === '1')
    setLowDismissed(localStorage.getItem(lowKey) === '1')
  }, [brokenKey, lowKey])

  function dismissBroken() {
    localStorage.setItem(brokenKey, '1')
    setBrokenDismissed(true)
  }

  function dismissLow() {
    localStorage.setItem(lowKey, '1')
    setLowDismissed(true)
  }

  if (brokenMachines.length === 0 && lowInventoryItems.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {/* Broken machines banner */}
      {brokenMachines.length > 0 && !brokenDismissed && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <Wrench className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">故障中の機器があります</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {brokenMachines.slice(0, 5).map((m) => (
                <span key={m.id} className="text-xs text-red-700">
                  {m.storeName} / {m.name}
                </span>
              ))}
              {brokenMachines.length > 5 && (
                <span className="text-xs text-red-600">他 {brokenMachines.length - 5}件</span>
              )}
            </div>
            <Link
              href="/dashboard/stores"
              className="inline-block mt-1.5 text-xs font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
            >
              店舗管理で確認する
            </Link>
          </div>
          <button
            onClick={dismissBroken}
            aria-label="閉じる"
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Low inventory banner */}
      {lowInventoryItems.length > 0 && !lowDismissed && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">在庫が少なくなっています</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {lowInventoryItems.slice(0, 5).map((item) => (
                <span key={item.id} className="text-xs text-amber-700">
                  {item.storeName} / {item.typeName}: {item.quantity}
                </span>
              ))}
              {lowInventoryItems.length > 5 && (
                <span className="text-xs text-amber-600">他 {lowInventoryItems.length - 5}件</span>
              )}
            </div>
            <Link
              href="/dashboard/inventory"
              className="inline-block mt-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
            >
              在庫管理で確認する
            </Link>
          </div>
          <button
            onClick={dismissLow}
            aria-label="閉じる"
            className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
