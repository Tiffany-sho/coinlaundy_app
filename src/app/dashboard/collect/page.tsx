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

  let query = supabase
    .from('collect_funds')
    .select('*, laundry_store(id, name)', { count: 'exact' })
    .order('collected_at', { ascending: false })
    .range(from, to)

  if (params.store) {
    query = query.eq('laundry_id', params.store)
  } else if (stores.length > 0 && membership?.org_id) {
    const storeIds = stores.map((s) => s.id)
    query = query.in('laundry_id', storeIds)
  }

  if (params.from) query = query.gte('collected_at', params.from)
  if (params.to) {
    const toDate = new Date(params.to)
    toDate.setDate(toDate.getDate() + 1)
    query = query.lt('collected_at', toDate.toISOString())
  }

  const { data: rawData, count } = await query
  const rawRecords = (rawData ?? []) as Array<CollectFunds & { laundry_store: Pick<LaundryStore, 'id' | 'name'> | null }>

  const uniqueCollectorIds = [...new Set(rawRecords.map((r) => r.collector_id).filter(Boolean))]
  const profileMap: Record<string, Pick<Profile, 'id' | 'full_name' | 'username'>> = {}
  if (uniqueCollectorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', uniqueCollectorIds)
    profiles?.forEach((p: Pick<Profile, 'id' | 'full_name' | 'username'>) => { profileMap[p.id] = p })
  }

  const records: CollectWithStore[] = rawRecords.map((r) => ({
    ...r,
    collector: profileMap[r.collector_id] ?? null,
  }))

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const selectedStore = params.store ? stores.find((s) => s.id === params.store) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">集金記録</h1>
          <p className="mt-1 text-sm text-ink-mute">
            コインランドリーの集金履歴を管理します
          </p>
        </div>
        {canEdit && (
          <Link
            href={params.store ? `/dashboard/collect/new?store=${params.store}` : '/dashboard/collect/new'}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-deep text-on-primary text-sm font-medium px-4 py-2.5 rounded-sm transition"
          >
            <Plus className="h-4 w-4" />
            集金を記録する
          </Link>
        )}
      </div>

      <form method="get" className="bg-canvas rounded-lg border border-hairline p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-ink-mute mb-1">店舗</label>
          <select
            name="store"
            defaultValue={params.store ?? ''}
            className="text-sm border border-hairline rounded-sm px-3 py-2 focus:outline-none focus:border-ink-mute-2 bg-canvas"
          >
            <option value="">全店舗</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-mute mb-1">開始日</label>
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ''}
            className="text-sm border border-hairline rounded-sm px-3 py-2 focus:outline-none focus:border-ink-mute-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-mute mb-1">終了日</label>
          <input
            type="date"
            name="to"
            defaultValue={params.to ?? ''}
            className="text-sm border border-hairline rounded-sm px-3 py-2 focus:outline-none focus:border-ink-mute-2"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-deep text-on-primary rounded-sm transition"
        >
          絞り込む
        </button>
        {(params.store || params.from || params.to) && (
          <Link
            href="/dashboard/collect"
            className="px-4 py-2 text-sm font-medium text-ink bg-canvas border border-hairline hover:bg-canvas-soft rounded-sm transition"
          >
            リセット
          </Link>
        )}
      </form>

      {selectedStore && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-canvas-soft text-ink-mute border border-hairline rounded-full text-sm">
          <Store className="h-3.5 w-3.5" />
          <span className="font-medium">{selectedStore.name}</span>の集金記録
        </div>
      )}

      {records.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-hairline bg-canvas p-12 text-center">
          <Wallet className="mx-auto h-12 w-12 text-ink-faint mb-4" />
          <h3 className="text-lg font-medium text-ink mb-1">集金記録がありません</h3>
          <p className="text-sm text-ink-mute mb-6">集金を行ったら記録してください。</p>
          {canEdit && (
            <Link
              href="/dashboard/collect/new"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-deep text-on-primary text-sm font-medium px-5 py-2.5 rounded-sm transition"
            >
              <Plus className="h-4 w-4" />
              集金を記録する
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-canvas rounded-lg border border-hairline overflow-hidden">
          <div className="divide-y divide-hairline">
            {records.map((record) => {
              const collectorName =
                record.collector?.full_name ?? record.collector?.username ?? '不明'
              return (
                <Link
                  key={record.id}
                  href={`/dashboard/collect/${record.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-canvas-soft transition group"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex-shrink-0 mt-0.5 w-9 h-9 bg-canvas-soft rounded-lg flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-ink group-hover:text-primary transition">
                          {record.laundry_store?.name ?? '不明な店舗'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-ink-mute">
                          <CalendarDays className="h-3 w-3" />
                          {formatDateJST(record.collected_at)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-ink-mute">
                          <User className="h-3 w-3" />
                          {collectorName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-lg font-medium text-ink">
                      {formatAmount(record.total_funds)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-hairline bg-canvas-soft">
              <span className="text-xs text-ink-mute">
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
                    className="px-3 py-1 text-sm text-ink-mute hover:text-ink border border-hairline rounded-sm bg-canvas hover:bg-canvas-soft transition"
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
                    className="px-3 py-1 text-sm text-ink-mute hover:text-ink border border-hairline rounded-sm bg-canvas hover:bg-canvas-soft transition"
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
