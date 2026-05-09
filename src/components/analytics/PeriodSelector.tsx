'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface Props {
  currentFrom: string
  currentTo: string
  currentPeriod: string
}

export default function PeriodSelector({ currentFrom, currentTo, currentPeriod }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(params)) {
        if (v) {
          sp.set(k, v)
        } else {
          sp.delete(k)
        }
      }
      router.push(`/dashboard/analytics?${sp.toString()}`)
    },
    [router, searchParams]
  )

  function setThisMonth() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const from = `${year}-${month}-01`
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
    const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
    navigate({ period: 'this_month', from, to })
  }

  function setLastMonth() {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const from = `${year}-${month}-01`
    const lastDay = new Date(year, d.getMonth() + 1, 0).getDate()
    const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
    navigate({ period: 'last_month', from, to })
  }

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    navigate({ period: 'custom', from: e.target.value, to: currentTo })
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    navigate({ period: 'custom', from: currentFrom, to: e.target.value })
  }

  const btnBase =
    'px-4 py-2 text-sm font-medium rounded-sm transition border'
  const activeBtn =
    'bg-primary text-on-primary border-primary'
  const inactiveBtn =
    'bg-canvas text-ink-mute border-hairline hover:bg-canvas-soft hover:border-hairline-strong'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={setThisMonth}
        className={`${btnBase} ${currentPeriod === 'this_month' ? activeBtn : inactiveBtn}`}
      >
        今月
      </button>
      <button
        type="button"
        onClick={setLastMonth}
        className={`${btnBase} ${currentPeriod === 'last_month' ? activeBtn : inactiveBtn}`}
      >
        先月
      </button>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={currentFrom}
          onChange={handleFromChange}
          className="text-sm border border-hairline rounded-sm px-3 py-2 focus:outline-none focus:border-ink-mute-2 bg-canvas"
        />
        <span className="text-ink-mute text-sm">〜</span>
        <input
          type="date"
          value={currentTo}
          onChange={handleToChange}
          className="text-sm border border-hairline rounded-sm px-3 py-2 focus:outline-none focus:border-ink-mute-2 bg-canvas"
        />
      </div>
    </div>
  )
}
