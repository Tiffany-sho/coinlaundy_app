import { Suspense } from 'react'
import { BarChart3, TrendingUp, Store, ArrowUpDown } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatAmount } from '@/lib/utils'
import {
  aggregateByMonth,
  aggregateByStore,
  getJSTMonthRange,
} from '@/lib/analytics'
import type { CollectFunds, LaundryStore } from '@/types/database'
import PeriodSelector from '@/components/analytics/PeriodSelector'
import MonthlyChart from '@/components/analytics/MonthlyChart'
import StoreComparisonChart from '@/components/analytics/StoreComparisonChart'

interface PageProps {
  searchParams: Promise<{
    period?: string
    from?: string
    to?: string
  }>
}

function getDefaultPeriod(): { period: string; from: string; to: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const { start, end } = getJSTMonthRange(year, month)
  // Convert back to date strings (YYYY-MM-DD) for inputs
  const fromDate = new Date(start)
  const toDate = new Date(end)
  return {
    period: 'this_month',
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
  }
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { membership } = await getCurrentUserWithOrg()

  const defaults = getDefaultPeriod()
  const period = params.period ?? defaults.period
  const from = params.from ?? defaults.from
  const to = params.to ?? defaults.to

  const supabase = await createClient()

  let stores: LaundryStore[] = []
  let records: CollectFunds[] = []
  let prevRecords: CollectFunds[] = []

  if (membership?.org_id) {
    // Fetch stores
    const { data: storeData } = await supabase
      .from('laundry_store')
      .select('*')
      .eq('organization_id', membership.org_id)
      .order('name', { ascending: true })
    stores = storeData ?? []

    if (stores.length > 0) {
      const storeIds = stores.map((s) => s.id)

      // Fetch current period records
      const fromUTC = new Date(from + 'T00:00:00+09:00').toISOString()
      const toUTC = new Date(to + 'T23:59:59+09:00').toISOString()

      const { data: currentData } = await supabase
        .from('collect_funds')
        .select('*')
        .in('laundry_id', storeIds)
        .gte('collected_at', fromUTC)
        .lte('collected_at', toUTC)
        .order('collected_at', { ascending: true })
      records = currentData ?? []

      // Calculate previous period for comparison
      const periodLengthMs =
        new Date(toUTC).getTime() - new Date(fromUTC).getTime()
      const prevToUTC = new Date(new Date(fromUTC).getTime() - 1).toISOString()
      const prevFromUTC = new Date(
        new Date(fromUTC).getTime() - periodLengthMs - 1
      ).toISOString()

      const { data: prevData } = await supabase
        .from('collect_funds')
        .select('*')
        .in('laundry_id', storeIds)
        .gte('collected_at', prevFromUTC)
        .lte('collected_at', prevToUTC)
      prevRecords = prevData ?? []
    }
  }

  // Aggregate data
  const monthlyData = aggregateByMonth(records, stores)
  const storeData = aggregateByStore(records, stores)
  const storeNames = stores.map((s) => s.name)

  // Summary stats
  const periodTotal = records.reduce((sum, r) => sum + r.total_funds, 0)
  const prevTotal = prevRecords.reduce((sum, r) => sum + r.total_funds, 0)
  const topStore = storeData[0] ?? null
  const avgPerStore =
    storeData.length > 0
      ? Math.round(
          storeData.reduce((s, d) => s + d.total, 0) / storeData.length
        )
      : 0
  const periodChange =
    prevTotal > 0
      ? Math.round(((periodTotal - prevTotal) / prevTotal) * 100)
      : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">分析</h1>
          <p className="mt-1 text-sm text-ink-mute">
            集金データの統計と傾向を確認できます
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-canvas rounded-lg border border-hairline p-4 mb-6">
        <p className="text-xs font-medium text-ink-mute mb-3">集計期間</p>
        <Suspense>
          <PeriodSelector
            currentFrom={from}
            currentTo={to}
            currentPeriod={period}
          />
        </Suspense>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={<BarChart3 className="h-6 w-6 text-primary" />}
          label="合計集金額"
          value={formatAmount(periodTotal)}
          bgColor="bg-canvas-soft"
        />
        <SummaryCard
          icon={<Store className="h-6 w-6 text-primary" />}
          label="最多収益店舗"
          value={topStore ? topStore.storeName : '—'}
          sub={topStore ? formatAmount(topStore.total) : undefined}
          bgColor="bg-canvas-soft"
        />
        <SummaryCard
          icon={<ArrowUpDown className="h-6 w-6 text-primary" />}
          label="平均集金額/店舗"
          value={storeData.length > 0 ? formatAmount(avgPerStore) : '—'}
          bgColor="bg-canvas-soft"
        />
        <SummaryCard
          icon={<TrendingUp className="h-6 w-6 text-primary" />}
          label="前期比"
          value={
            periodChange !== null
              ? `${periodChange >= 0 ? '+' : ''}${periodChange}%`
              : '—'
          }
          valueColor={
            periodChange === null
              ? 'text-ink-faint'
              : periodChange >= 0
              ? 'text-primary'
              : 'text-accent-tomato'
          }
          bgColor="bg-canvas-soft"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Monthly trend */}
        <div className="bg-canvas rounded-lg border border-hairline p-5">
          <h2 className="text-base font-medium text-ink mb-4">
            月別集金推移
          </h2>
          <MonthlyChart data={monthlyData} storeNames={storeNames} />
        </div>

        {/* Store comparison */}
        <div className="bg-canvas rounded-lg border border-hairline p-5">
          <h2 className="text-base font-medium text-ink mb-4">
            店舗別集金額（期間合計）
          </h2>
          <StoreComparisonChart data={storeData} />
        </div>
      </div>

      {/* Per-store breakdown table */}
      <div className="bg-canvas rounded-lg border border-hairline overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline">
          <h2 className="text-base font-medium text-ink">
            店舗別内訳
          </h2>
        </div>
        {storeData.length === 0 ? (
          <div className="p-10 text-center text-ink-faint text-sm">
            データがありません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas-soft text-xs text-ink-mute font-medium uppercase tracking-wide">
                <th className="px-5 py-3 text-left">店舗名</th>
                <th className="px-5 py-3 text-right">集金額</th>
                <th className="px-5 py-3 text-right">構成比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {storeData.map((store) => {
                const pct =
                  periodTotal > 0
                    ? Math.round((store.total / periodTotal) * 100)
                    : 0
                return (
                  <tr
                    key={store.storeId}
                    className="hover:bg-canvas-soft transition"
                  >
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {store.storeName}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-primary">
                      {formatAmount(store.total)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-mute">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-canvas-soft rounded-full h-1.5 overflow-hidden border border-hairline">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-hairline-strong bg-canvas-soft">
                <td className="px-5 py-3 font-medium text-ink">
                  合計
                </td>
                <td className="px-5 py-3 text-right font-medium text-primary">
                  {formatAmount(periodTotal)}
                </td>
                <td className="px-5 py-3 text-right text-ink-mute">100%</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  bgColor,
  valueColor = 'text-gray-900',
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  bgColor: string
  valueColor?: string
}) {
  return (
    <div className="bg-canvas rounded-lg border border-hairline p-5 flex items-center gap-4">
      <div className={`${bgColor} p-3 rounded-lg border border-hairline flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-ink-mute mb-0.5">{label}</p>
        <p className={`text-xl font-medium truncate ${valueColor}`}>{value}</p>
        {sub && <p className="text-xs text-ink-mute mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
