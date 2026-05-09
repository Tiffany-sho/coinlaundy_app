import type { CollectFunds, LaundryStore } from '@/types/database'

export type MonthlyData = {
  month: string   // "2025-01"
  label: string   // "2025年1月"
  total: number
  byStore: Record<string, number>
}

export type StoreData = {
  storeId: string
  storeName: string
  total: number
}

/**
 * Convert a UTC ISO string to JST month key "YYYY-MM"
 */
function toJSTMonthKey(isoString: string): string {
  const date = new Date(isoString)
  // Add 9 hours for JST
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const year = jst.getUTCFullYear()
  const month = String(jst.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function monthKeyToLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  return `${year}年${parseInt(month, 10)}月`
}

export function aggregateByMonth(
  records: CollectFunds[],
  stores: LaundryStore[]
): MonthlyData[] {
  const storeMap = new Map(stores.map((s) => [s.id, s.name]))
  const monthMap = new Map<string, MonthlyData>()

  for (const record of records) {
    const month = toJSTMonthKey(record.collected_at)
    if (!monthMap.has(month)) {
      monthMap.set(month, {
        month,
        label: monthKeyToLabel(month),
        total: 0,
        byStore: {},
      })
    }
    const entry = monthMap.get(month)!
    entry.total += record.total_funds
    const storeName = storeMap.get(record.laundry_id) ?? record.laundry_id
    entry.byStore[storeName] = (entry.byStore[storeName] ?? 0) + record.total_funds
  }

  return Array.from(monthMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  )
}

export function aggregateByStore(
  records: CollectFunds[],
  stores: LaundryStore[]
): StoreData[] {
  const storeMap = new Map(stores.map((s) => [s.id, s.name]))
  const totals = new Map<string, number>()

  for (const record of records) {
    const prev = totals.get(record.laundry_id) ?? 0
    totals.set(record.laundry_id, prev + record.total_funds)
  }

  return stores
    .map((store) => ({
      storeId: store.id,
      storeName: storeMap.get(store.id) ?? store.id,
      total: totals.get(store.id) ?? 0,
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Get UTC date range for a JST month (year, month are 1-indexed)
 */
export function getJSTMonthRange(year: number, month: number) {
  // Start of month in JST => subtract 9h for UTC
  const startJST = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const endJST = new Date(year, month, 0, 23, 59, 59, 999) // last day of month
  const jstOffset = 9 * 60 * 60 * 1000
  return {
    start: new Date(startJST.getTime() - jstOffset).toISOString(),
    end: new Date(endJST.getTime() - jstOffset).toISOString(),
  }
}
