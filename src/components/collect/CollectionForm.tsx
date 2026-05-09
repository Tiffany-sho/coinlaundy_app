'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createCollectionAction, updateCollectionAction } from '@/app/dashboard/collect/actions'
import type { LaundryStore, Machine, Profile, CollectFunds, FundsItem } from '@/types/database'
import { formatAmount } from '@/lib/utils'

interface CollectionFormProps {
  stores: LaundryStore[]
  initialStoreId?: string
  machines: Machine[]
  profile: Profile
  initialData?: CollectFunds
}

const DENOMINATIONS = [10, 50, 100, 500, 1000] as const
type DenomKey = '10' | '50' | '100' | '500' | '1000'

type DenomCounts = Record<DenomKey, number>

interface MachineEntry {
  machine_id: string
  name: string
  amount: number
  denominations?: DenomCounts
}

function defaultDenoms(): DenomCounts {
  return { '10': 0, '50': 0, '100': 0, '500': 0, '1000': 0 }
}

function calcFromDenoms(denoms: DenomCounts): number {
  return DENOMINATIONS.reduce(
    (sum, d) => sum + (denoms[String(d) as DenomKey] ?? 0) * d,
    0
  )
}

function nowJSTString(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 16)
}

export default function CollectionForm({
  stores,
  initialStoreId,
  machines: initialMachines,
  profile,
  initialData,
}: CollectionFormProps) {
  const isEdit = !!initialData

  const collectMethod = profile.collect_method ?? 'machines'
  const trackDenoms = profile.track_denominations ?? false

  const initialStoreIdResolved = initialData?.laundry_id ?? initialStoreId ?? stores[0]?.id ?? ''

  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreIdResolved)
  const [loadingMachines, setLoadingMachines] = useState(false)

  function readDraft(storeId: string): { collectedAt?: string; entries?: MachineEntry[] } | null {
    if (isEdit || !storeId || typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(`draft_collect_${storeId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const [collectedAt, setCollectedAt] = useState<string>(() => {
    if (initialData?.collected_at) {
      const d = new Date(initialData.collected_at)
      const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
      return jst.toISOString().slice(0, 16)
    }
    const draft = readDraft(initialStoreIdResolved)
    return draft?.collectedAt ?? nowJSTString()
  })

  const [entries, setEntries] = useState<MachineEntry[]>(() => {
    if (initialData?.funds_array) {
      const arr = initialData.funds_array as FundsItem[]
      return arr.map((item) => ({
        machine_id: item.machine_id,
        name: item.name,
        amount: item.amount,
        denominations: item.denominations
          ? {
              '10': item.denominations['10'] ?? 0,
              '50': item.denominations['50'] ?? 0,
              '100': item.denominations['100'] ?? 0,
              '500': item.denominations['500'] ?? 0,
              '1000': item.denominations['1000'] ?? 0,
            }
          : trackDenoms
          ? defaultDenoms()
          : undefined,
      }))
    }

    const draft = readDraft(initialStoreIdResolved)
    if (draft?.entries) return draft.entries

    if (collectMethod === 'total') {
      return [
        {
          machine_id: 'total',
          name: '合計金額',
          amount: 0,
          denominations: trackDenoms ? defaultDenoms() : undefined,
        },
      ]
    }

    return initialMachines.map((m) => ({
      machine_id: m.id,
      name: m.name,
      amount: 0,
      denominations: trackDenoms ? defaultDenoms() : undefined,
    }))
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const draftKey = `draft_collect_${selectedStoreId}`

  useEffect(() => {
    if (isEdit || !selectedStoreId) return
    try {
      localStorage.setItem(draftKey, JSON.stringify({ collectedAt, entries }))
    } catch {
      // ignore
    }
  }, [collectedAt, entries, draftKey, isEdit, selectedStoreId])

  const fetchMachinesForStore = useCallback(
    async (storeId: string) => {
      if (collectMethod !== 'machines') return
      setLoadingMachines(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('machines')
        .select('*')
        .eq('laundry_id', storeId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
      const fetched: Machine[] = data ?? []
      setEntries(
        fetched.map((m) => ({
          machine_id: m.id,
          name: m.name,
          amount: 0,
          denominations: trackDenoms ? defaultDenoms() : undefined,
        }))
      )
      setLoadingMachines(false)
    },
    [collectMethod, trackDenoms]
  )

  const handleStoreChange = async (storeId: string) => {
    setSelectedStoreId(storeId)
    // Load draft for the newly selected store
    const draft = readDraft(storeId)
    if (draft?.entries) {
      if (draft.collectedAt) setCollectedAt(draft.collectedAt)
      setEntries(draft.entries)
      return
    }
    if (collectMethod === 'total') {
      setEntries([
        {
          machine_id: 'total',
          name: '合計金額',
          amount: 0,
          denominations: trackDenoms ? defaultDenoms() : undefined,
        },
      ])
    } else {
      await fetchMachinesForStore(storeId)
    }
  }

  const updateAmount = (idx: number, amount: number) => {
    setEntries((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], amount }
      return next
    })
  }

  const updateDenom = (idx: number, denom: DenomKey, count: number) => {
    setEntries((prev) => {
      const next = [...prev]
      const entry = { ...next[idx] }
      const denoms = { ...(entry.denominations ?? defaultDenoms()), [denom]: count }
      entry.denominations = denoms
      entry.amount = calcFromDenoms(denoms)
      next[idx] = entry
      return next
    })
  }

  const totalFunds = entries.reduce((sum, e) => sum + e.amount, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData()
    formData.set('laundry_id', selectedStoreId)
    const localDate = new Date(collectedAt)
    const utcDate = new Date(localDate.getTime() - 9 * 60 * 60 * 1000)
    formData.set('collected_at', utcDate.toISOString())

    const fundsArray: FundsItem[] = entries.map((e) => ({
      machine_id: e.machine_id,
      name: e.name,
      amount: e.amount,
      ...(e.denominations ? { denominations: e.denominations } : {}),
    }))
    formData.set('funds_array', JSON.stringify(fundsArray))

    const result = isEdit
      ? await updateCollectionAction(initialData!.id, formData)
      : await createCollectionAction(formData)

    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    if (!isEdit && selectedStoreId) {
      try {
        localStorage.removeItem(draftKey)
      } catch {
        // ignore
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-[#fff3f0] border border-accent-tomato/30 text-accent-tomato px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {!initialStoreId && !isEdit && (
        <div className="bg-canvas rounded-lg border border-hairline p-5">
          <label className="block text-sm font-medium text-ink-mute mb-2">店舗を選択</label>
          <select
            value={selectedStoreId}
            onChange={(e) => handleStoreChange(e.target.value)}
            required
            className="w-full text-sm border border-hairline rounded-sm px-3 py-2.5 focus:outline-none focus:border-ink-mute-2 bg-canvas"
          >
            <option value="">-- 店舗を選択してください --</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-canvas rounded-lg border border-hairline p-5">
        <label className="block text-sm font-medium text-ink-mute mb-2">集金日時</label>
        <input
          type="datetime-local"
          value={collectedAt}
          onChange={(e) => setCollectedAt(e.target.value)}
          required
          className="w-full text-sm border border-hairline rounded-sm px-3 py-2.5 focus:outline-none focus:border-ink-mute-2"
        />
      </div>

      <div className="bg-canvas rounded-lg border border-hairline p-5">
        <h2 className="text-sm font-medium text-ink-mute mb-4">
          {collectMethod === 'total' ? '集金額' : '機器別集金額'}
        </h2>

        {loadingMachines ? (
          <div className="py-6 text-center text-sm text-ink-faint">機器情報を読み込み中...</div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry, idx) => (
              <div key={entry.machine_id} className="border border-hairline rounded-md p-4 bg-canvas-soft">
                {collectMethod === 'machines' && (
                  <div className="text-sm font-medium text-ink mb-3">{entry.name}</div>
                )}

                {trackDenoms && entry.denominations ? (
                  <>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {DENOMINATIONS.map((d) => {
                        const key = String(d) as DenomKey
                        return (
                          <div key={d} className="text-center">
                            <label className="block text-xs text-ink-mute mb-1">{d}円</label>
                            <input
                              type="number"
                              min={0}
                              value={entry.denominations![key]}
                              onChange={(e) =>
                                updateDenom(idx, key, parseInt(e.target.value, 10) || 0)
                              }
                              className="w-full text-center text-sm font-medium border border-hairline rounded-sm py-2 focus:outline-none focus:border-ink-mute-2 bg-canvas"
                            />
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between border-t border-hairline pt-2">
                      <span className="text-xs text-ink-mute">小計</span>
                      <span className="text-base font-medium text-ink">{formatAmount(entry.amount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-ink-mute font-medium">¥</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={entry.amount === 0 ? '' : entry.amount}
                      onChange={(e) => updateAmount(idx, parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      className="flex-1 text-right text-2xl font-medium border border-hairline rounded-sm px-4 py-3 focus:outline-none focus:border-ink-mute-2 bg-canvas"
                    />
                    <span className="text-ink-mute font-medium">円</span>
                  </div>
                )}
              </div>
            ))}

            {entries.length === 0 && collectMethod === 'machines' && (
              <p className="text-sm text-ink-faint text-center py-4">
                この店舗には機器が登録されていません。
              </p>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 bg-canvas border border-hairline rounded-lg shadow-sm p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-mute mb-0.5">合計集金額</p>
          <p className="text-3xl font-medium text-ink">{formatAmount(totalFunds)}</p>
        </div>
        <button
          type="submit"
          disabled={submitting || !selectedStoreId || totalFunds === 0}
          className="px-6 py-3 bg-primary hover:bg-primary-deep disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-medium rounded-sm transition text-sm"
        >
          {submitting ? '保存中...' : isEdit ? '更新する' : '記録する'}
        </button>
      </div>
    </form>
  )
}
