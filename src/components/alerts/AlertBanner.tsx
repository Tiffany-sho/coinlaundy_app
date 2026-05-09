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
      {brokenMachines.length > 0 && !brokenDismissed && (
        <div className="flex items-start gap-3 bg-[#fff3f0] border-l-4 border-accent-tomato rounded-md px-4 py-3">
          <Wrench className="h-5 w-5 text-accent-tomato flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">故障中の機器があります</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {brokenMachines.slice(0, 5).map((m) => (
                <span key={m.id} className="text-xs text-ink-mute">{m.storeName} / {m.name}</span>
              ))}
              {brokenMachines.length > 5 && (
                <span className="text-xs text-ink-mute">他 {brokenMachines.length - 5}件</span>
              )}
            </div>
            <Link
              href="/dashboard/stores"
              className="inline-block mt-1.5 text-xs font-medium text-ink-mute underline hover:text-ink underline-offset-2"
            >
              店舗管理で確認する
            </Link>
          </div>
          <button onClick={dismissBroken} aria-label="閉じる" className="flex-shrink-0 text-ink-mute hover:text-ink transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {lowInventoryItems.length > 0 && !lowDismissed && (
        <div className="flex items-start gap-3 bg-[#fffbe0] border-l-4 border-accent-yellow rounded-md px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-ink-mute flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">在庫が少なくなっています</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {lowInventoryItems.slice(0, 5).map((item) => (
                <span key={item.id} className="text-xs text-ink-mute">
                  {item.storeName} / {item.typeName}: {item.quantity}
                </span>
              ))}
              {lowInventoryItems.length > 5 && (
                <span className="text-xs text-ink-mute">他 {lowInventoryItems.length - 5}件</span>
              )}
            </div>
            <Link
              href="/dashboard/inventory"
              className="inline-block mt-1.5 text-xs font-medium text-ink-mute underline hover:text-ink underline-offset-2"
            >
              在庫管理で確認する
            </Link>
          </div>
          <button onClick={dismissLow} aria-label="閉じる" className="flex-shrink-0 text-ink-mute hover:text-ink transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
