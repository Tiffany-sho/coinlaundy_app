import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Plus, Wallet, CalendarDays, User } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatAmount, formatDateJST } from '@/lib/utils'
import type { CollectFunds, Profile } from '@/types/database'

interface CollectWithCollector extends CollectFunds {
  collector: Pick<Profile, 'id' | 'full_name' | 'username'> | null
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    from?: string
    to?: string
    page?: string
  }>
}

const PAGE_SIZE = 20

export default async function StoreCollectPage({ params, searchParams }: PageProps) {
  const { id: storeId } = await params
  const sp = await searchParams
  const { profile } = await getCurrentUserWithOrg()
  const canEdit = profile.role === 'admin' || profile.role === 'collecter'

  const supabase = await createClient()

  // Fetch store
  const { data: store } = await supabase
    .from('laundry_store')
    .select('id, name')
    .eq('id', storeId)
    .single()

  if (!store) notFound()

  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('collect_funds')
    .select(
      `*,
      collector:profiles!collect_funds_collector_id_fkey(id, full_name, username)`,
      { count: 'exact' }
    )
    .eq('laundry_id', storeId)
    .order('collected_at', { ascending: false })
    .range(from, to)

  if (sp.from) {
    query = query.gte('collected_at', sp.from)
  }
  if (sp.to) {
    const toDate = new Date(sp.to)
    toDate.setDate(toDate.getDate() + 1)
    query = query.lt('collected_at', toDate.toISOString())
  }

  const { data, count } = await query
  const records = (data ?? []) as CollectWithCollector[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Total for the filtered period
  const periodTotal = records.reduce((sum, r) => sum + r.total_funds, 0)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard/stores" className="hover:text-indigo-600 transition">店舗一覧</Link>
        <span>›</span>
        <Link href={`/dashboard/stores/${storeId}`} className="hover:text-indigo-600 transition">
          {store.name}
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">集金記録</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{store.name}の集金記録</h1>
          <p className="mt-1 text-sm text-gray-500">この店舗の集金履歴です</p>
        </div>
        {canEdit && (
          <Link
            href={`/dashboard/collect/new?store=${storeId}`}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            集金を記録する
          </Link>
        )}
      </div>

      {/* Date filter */}
      <form method="get" className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">開始日</label>
          <input
            type="date"
            name="from"
            defaultValue={sp.from ?? ''}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">終了日</label>
          <input
            type="date"
            name="to"
            defaultValue={sp.to ?? ''}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          絞り込む
        </button>
        {(sp.from || sp.to) && (
          <Link
            href={`/dashboard/stores/${storeId}/collect`}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition"
          >
            リセット
          </Link>
        )}
      </form>

      {/* Period summary */}
      {records.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">
            {sp.from || sp.to ? '期間合計' : '表示中の合計'}
          </span>
          <span className="text-2xl font-bold text-green-700">{formatAmount(periodTotal)}</span>
        </div>
      )}

      {/* Records */}
      {records.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <Wallet className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">集金記録がありません</h3>
          <p className="text-sm text-gray-500 mb-6">この店舗の集金を記録してください。</p>
          {canEdit && (
            <Link
              href={`/dashboard/collect/new?store=${storeId}`}
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
                    <div className="min-w-0 flex flex-col gap-1">
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
                      ...(sp.from ? { from: sp.from } : {}),
                      ...(sp.to ? { to: sp.to } : {}),
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
                      ...(sp.from ? { from: sp.from } : {}),
                      ...(sp.to ? { to: sp.to } : {}),
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
