import Link from 'next/link'
import { Plus, Wallet, CalendarDays, User, Store } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatAmount, formatDateJST } from '@/lib/utils'
import type { CollectFunds, LaundryStore, Profile } from '@/types/database'

interface CollectWithStore extends CollectFunds {
  laundry_store: Pick<LaundryStore, 'id' | 'name'> | null
  collector: Pick<Profile, 'id' | 'full_name' | 'username'> | null
}

interface PageProps {
  searchParams: Promise<{
    store?: string
    from?: string
    to?: string
    page?: string
  }>
}

const PAGE_SIZE = 20

export default async function CollectPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { profile, membership } = await getCurrentUserWithOrg()
  const canEdit = profile.role === 'admin' || profile.role === 'collecter'

  const supabase = await createClient()

  // Fetch stores for filter dropdown
  let stores: LaundryStore[] = []
  if (membership?.org_id) {
    const { data } = await supabase
      .from('laundry_store')
      .select('*')
      .eq('organization_id', membership.org_id)
      .order('name', { ascending: true })
    stores = data ?? []
  }

  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Build query
  let query = supabase
    .from('collect_funds')
    .select(
      `*,
      laundry_store!collect_funds_laundry_id_fkey(id, name),
      collector:profiles!collect_funds_collector_id_fkey(id, full_name, username)`,
      { count: 'exact' }
    )
    .order('collected_at', { ascending: false })
    .range(from, to)

  // Filter by store
  if (params.store) {
    query = query.eq('laundry_id', params.store)
  } else if (stores.length > 0 && membership?.org_id) {
    // Filter to org stores
    const storeIds = stores.map((s) => s.id)
    query = query.in('laundry_id', storeIds)
  }

  // Filter by date range
  if (params.from) {
    query = query.gte('collected_at', params.from)
  }
  if (params.to) {
    // Add 1 day to include the end date
    const toDate = new Date(params.to)
    toDate.setDate(toDate.getDate() + 1)
    query = query.lt('collected_at', toDate.toISOString())
  }

  const { data, count } = await query
  const records = (data ?? []) as CollectWithStore[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const selectedStore = params.store ? stores.find((s) => s.id === params.store) : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">集金記録</h1>
          <p className="mt-1 text-sm text-gray-500">
            コインランドリーの集金履歴を管理します
          </p>
        </div>
        {canEdit && (
          <Link
            href={params.store ? `/dashboard/collect/new?store=${params.store}` : '/dashboard/collect/new'}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            集金を記録する
          </Link>
        )}
      </div>

      {/* Filters */}
      <form method="get" className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">店舗</label>
          <select
            name="store"
            defaultValue={params.store ?? ''}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">全店舗</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">開始日</label>
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ''}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">終了日</label>
          <input
            type="date"
            name="to"
            defaultValue={params.to ?? ''}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          絞り込む
        </button>
        {(params.store || params.from || params.to) && (
          <Link
            href="/dashboard/collect"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition"
          >
            リセット
          </Link>
        )}
      </form>

      {selectedStore && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm">
          <Store className="h-3.5 w-3.5" />
          <span className="font-medium">{selectedStore.name}</span>の集金記録
        </div>
      )}

      {/* Records list */}
      {records.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <Wallet className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">集金記録がありません</h3>
          <p className="text-sm text-gray-500 mb-6">
            集金を行ったら記録してください。
          </p>
          {canEdit && (
            <Link
              href="/dashboard/collect/new"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
            >
              <Plus className="h-4 w-4" />
              集金を記録する
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {records.map((record) => {
              const collectorName =
                record.collector?.full_name ?? record.collector?.username ?? '不明'
              return (
                <Link
                  key={record.id}
                  href={`/dashboard/collect/${record.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition group"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex-shrink-0 mt-0.5 w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition">
                          {record.laundry_store?.name ?? '不明な店舗'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <CalendarDays className="h-3 w-3" />
                          {formatDateJST(record.collected_at)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          {collectorName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-lg font-bold text-green-600">
                      {formatAmount(record.total_funds)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                {(currentPage - 1) * PAGE_SIZE + 1}〜{Math.min(currentPage * PAGE_SIZE, count ?? 0)}件（全{count}件）
              </span>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`?${new URLSearchParams({
                      ...(params.store ? { store: params.store } : {}),
                      ...(params.from ? { from: params.from } : {}),
                      ...(params.to ? { to: params.to } : {}),
                      page: String(currentPage - 1),
                    })}`}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 border border-gray-200 rounded-lg bg-white hover:border-indigo-300 transition"
                  >
                    前へ
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`?${new URLSearchParams({
                      ...(params.store ? { store: params.store } : {}),
                      ...(params.from ? { from: params.from } : {}),
                      ...(params.to ? { to: params.to } : {}),
                      page: String(currentPage + 1),
                    })}`}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 border border-gray-200 rounded-lg bg-white hover:border-indigo-300 transition"
                  >
                    次へ
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
