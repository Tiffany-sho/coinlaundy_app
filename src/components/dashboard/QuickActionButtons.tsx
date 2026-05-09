'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Package, Wrench, X, ChevronRight } from 'lucide-react'

interface Store {
  id: string
  name: string
}

type ActionType = 'collect' | 'inventory' | 'machines'

interface ActionConfig {
  key: ActionType
  label: string
  description: string
  Icon: React.FC<{ className?: string }>
  isPrimary?: boolean
}

const ACTIONS: ActionConfig[] = [
  { key: 'collect', label: '集金', description: '集金を記録する', Icon: Wallet, isPrimary: true },
  { key: 'inventory', label: '在庫管理', description: '在庫数を更新する', Icon: Package },
  { key: 'machines', label: '設備状況', description: '機器の状態を確認・更新する', Icon: Wrench },
]

function getHref(action: ActionType, storeId: string): string {
  switch (action) {
    case 'collect': return `/dashboard/collect/new?store=${storeId}`
    case 'inventory': return `/dashboard/stores/${storeId}/inventory`
    case 'machines': return `/dashboard/stores/${storeId}/machines`
  }
}

export default function QuickActionButtons({ stores }: { stores: Store[] }) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)

  function handleActionClick(action: ActionType) {
    if (stores.length === 0) return
    if (stores.length === 1) router.push(getHref(action, stores[0].id))
    else setActiveAction(action)
  }

  const activeConfig = ACTIONS.find((a) => a.key === activeAction)

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium text-ink-mute-2 uppercase tracking-widest mb-3">クイックアクション</p>
        <div className="grid grid-cols-3 gap-3">
          {ACTIONS.map(({ key, label, Icon, isPrimary }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleActionClick(key)}
              disabled={stores.length === 0}
              className={`flex flex-col items-center gap-2.5 py-5 px-3 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isPrimary
                  ? 'bg-primary border-primary/20 hover:bg-primary-deep'
                  : 'bg-canvas border-hairline hover:bg-canvas-soft'
              }`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isPrimary ? 'bg-black/10' : 'bg-canvas-soft'}`}>
                <Icon className={`h-6 w-6 ${isPrimary ? 'text-on-primary' : 'text-primary'}`} />
              </div>
              <span className={`text-sm font-medium ${isPrimary ? 'text-on-primary' : 'text-ink'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveAction(null)} />
          <div className="relative bg-canvas rounded-xl border border-hairline shadow-lg w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-canvas-soft flex items-center justify-center">
                  {activeConfig && <activeConfig.Icon className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <p className="text-base font-medium text-ink">{activeConfig?.label}</p>
                  <p className="text-xs text-ink-mute">{activeConfig?.description}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveAction(null)}
                className="p-1.5 rounded-md text-ink-mute hover:text-ink hover:bg-canvas-soft transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 max-h-72 overflow-y-auto">
              <p className="text-xs font-medium text-ink-mute px-2 mb-2">店舗を選択</p>
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => { router.push(getHref(activeAction, store.id)); setActiveAction(null) }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-md hover:bg-canvas-soft transition text-left group"
                >
                  <span className="text-sm font-medium text-ink group-hover:text-primary transition">{store.name}</span>
                  <ChevronRight className="h-4 w-4 text-ink-faint group-hover:text-primary transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
