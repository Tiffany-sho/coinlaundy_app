import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ActionLog from '@/components/logs/ActionLog'
import type { ActionMessage } from '@/types/database'

interface ActionMessageWithActor extends ActionMessage {
  profiles: { full_name: string | null; username: string | null } | null
}

const PAGE_SIZE = 50

interface Props {
  searchParams: Promise<{ page?: string; from?: string; to?: string }>
}

export default async function LogsPage({ searchParams }: Props) {
  const { membership } = await getCurrentUserWithOrg()
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = params.from ?? ''
  const to = params.to ?? ''

  const supabase = await createClient()

  let actions: ActionMessageWithActor[] = []
  let totalCount = 0

  if (membership?.org_id) {
    let query = supabase
      .from('action_message')
      .select('*, profiles(full_name, username)', { count: 'exact' })
      .eq('org_id', membership.org_id)
      .order('occurred_at', { ascending: false })

    if (from) {
      query = query.gte('occurred_at', from + 'T00:00:00+09:00')
    }
    if (to) {
      query = query.lte('occurred_at', to + 'T23:59:59+09:00')
    }

    const { data, count } = await query.range(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE - 1
    )

    actions = (data ?? []) as ActionMessageWithActor[]
    totalCount = count ?? 0
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function buildHref(p: number) {
    const q = new URLSearchParams()
    q.set('page', p.toString())
    if (from) q.set('from', from)
    if (to) q.set('to', to)
    return `/dashboard/logs?${q.toString()}`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-50 p-2.5 rounded-xl">
          <Activity className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">アクションログ</h1>
          <p className="mt-0.5 text-sm text-gray-500">組織内での操作履歴を確認できます</p>
        </div>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 mb-6">
        <form method="get" action="/dashboard/logs" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="from" className="block text-xs font-medium text-gray-600 mb-1">
              開始日
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={from}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="to" className="block text-xs font-medium text-gray-600 mb-1">
              終了日
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={to}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
          >
            絞り込む
          </button>
          {(from || to) && (
            <a
              href="/dashboard/logs"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
            >
              クリア
            </a>
          )}
        </form>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">
            {totalCount > 0 ? `全 ${totalCount} 件` : 'ログなし'}
          </h2>
          {totalPages > 1 && (
            <span className="text-xs text-gray-500">
              {page} / {totalPages} ページ
            </span>
          )}
        </div>

        <ActionLog actions={actions} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {page > 1 ? (
              <a
                href={buildHref(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                前へ
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-100 rounded-lg cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
                前へ
              </span>
            )}

            <span className="px-3 py-2 text-sm text-gray-700 font-medium">
              {page} / {totalPages}
            </span>

            {page < totalPages ? (
              <a
                href={buildHref(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                次へ
                <ChevronRight className="h-4 w-4" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-100 rounded-lg cursor-not-allowed">
                次へ
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
