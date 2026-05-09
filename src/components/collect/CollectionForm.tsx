'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  // Format as datetime-local input value in JST
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
  const router = useRouter()
  const isEdit = !!initialData

  const collectMethod = profile.collect_method ?? 'machines'
  const trackDenoms = profile.track_denominations ?? false

  // ─── State ────────────────────────────────────────────────────────────────

  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    initialData?.laundry_id ?? initialStoreId ?? stores[0]?.id ?? ''
  )
  const [machines, setMachines] = useState<Machine[]>(initialMachines)
  const [loadingMachines, setLoadingMachines] = useState(false)
  const [collectedAt, setCollectedAt] = useState<string>(
    initialData?.collected_at
      ? (() => {
          const d = new Date(initialData.collected_at)
          const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
          return jst.toISOString().slice(0, 16)
        })()
      : nowJSTString()
  )

  // Per-machine entries
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

    // machines mode - init from initialMachines
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

  // ─── Draft ────────────────────────────────────────────────────────────────

  // Load draft on mount (only for new records)
  useEffect(() => {
    if (isEdit || !selectedStoreId) return
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const draft = JSON.parse(raw) as {
          collectedAt: string
          entries: MachineEntry[]
        }
        setCollectedAt(draft.collectedAt ?? nowJSTString())
        setEntries(draft.entries ?? [])
      }
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, isEdit])

  // Save draft whenever entries or date changes (not in edit mode)
  useEffect(() => {
    if (isEdit || !selectedStoreId) return
    try {
      localStorage.setItem(draftKey, JSON.stringify({ collectedAt, entries }))
    } catch {
      // ignore
    }
  }, [collectedAt, entries, draftKey, isEdit, selectedStoreId])

  // ─── Store change ─────────────────────────────────────────────────────────

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
      setMachines(fetched)
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

  // ─── Amount helpers ───────────────────────────────────────────────────────

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

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData()
    formData.set('laundry_id', selectedStoreId)
    // Convert local datetime to UTC ISO
    const localDate = new Date(collectedAt)
    // collectedAt is local time (JST), subtract offset to get UTC
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

    // Clear draft on success
    if (!isEdit && selectedStoreId) {
      try {
        localStorage.removeItem(draftKey)
      } catch {
        // ignore
      }
    }
    // redirect handled by server action
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Store selector */}
      {!initialStoreId && !isEdit && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">店舗を選択</label>
          <select
            value={selectedStoreId}
            onChange={(e) => handleStoreChange(e.target.value)}
            required
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">-- 店舗を選択してください --</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date / time */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">集金日時</label>
        <input
          type="datetime-local"
          value={collectedAt}
          onChange={(e) => setCollectedAt(e.target.value)}
          required
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Amount inputs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          {collectMethod === 'total' ? '集金額' : '機器別集金額'}
        </h2>

        {loadingMachines ? (
          <div className="py-6 text-center text-sm text-gray-400">機器情報を読み込み中...</div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry, idx) => (
              <div key={entry.machine_id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                {collectMethod === 'machines' && (
                  <div className="text-sm font-medium text-gray-800 mb-3">{entry.name}</div>
                )}

                {trackDenoms && entry.denominations ? (
                  <>
                    {/* Denomination grid */}
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {DENOMINATIONS.map((d) => {
                        const key = String(d) as DenomKey
                        return (
                          <div key={d} className="text-center">
                            <label className="block text-xs text-gray-500 mb-1">{d}円</label>
                            <input
                              type="number"
                              min={0}
                              value={entry.denominations![key]}
                              onChange={(e) =>
                                updateDenom(idx, key, parseInt(e.target.value, 10) || 0)
                              }
                              className="w-full text-center text-sm font-semibold border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                            />
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                      <span className="text-xs text-gray-500">小計</span>
                      <span className="text-base font-bold text-green-600">{formatAmount(entry.amount)}</span>
                    </div>
                  </>
                ) : (
                  /* Simple amount input */
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-medium">¥</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={entry.amount === 0 ? '' : entry.amount}
                      onChange={(e) => updateAmount(idx, parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      className="flex-1 text-right text-2xl font-bold border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <span className="text-gray-500 font-medium">円</span>
                  </div>
                )}
              </div>
            ))}

            {entries.length === 0 && collectMethod === 'machines' && (
              <p className="text-sm text-gray-400 text-center py-4">
                この店舗には機器が登録されていません。
              </p>
            )}
          </div>
        )}
      </div>

      {/* Running total - sticky on mobile */}
      <div className="sticky bottom-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">合計集金額</p>
          <p className="text-3xl font-bold text-green-600">{formatAmount(totalFunds)}</p>
        </div>
        <button
          type="submit"
          disabled={submitting || !selectedStoreId || totalFunds === 0}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm"
        >
          {submitting ? '保存中...' : isEdit ? '更新する' : '記録する'}
        </button>
      </div>
    </form>
  )
}
