import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, CalendarDays, User, Store, WashingMachine } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { deleteCollectionAction } from '@/app/dashboard/collect/actions'
import { formatAmount, formatDateJST } from '@/lib/utils'
import type { CollectFunds, LaundryStore, Profile, FundsItem } from '@/types/database'

interface CollectWithRelations extends CollectFunds {
  laundry_store: Pick<LaundryStore, 'id' | 'name'> | null
  collector: Pick<Profile, 'id' | 'full_name' | 'username'> | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params
  const { user, profile } = await getCurrentUserWithOrg()
  const isAdmin = profile.role === 'admin'

  const supabase = await createClient()

  const { data } = await supabase
    .from('collect_funds')
    .select(
      `*,
      laundry_store!collect_funds_laundry_id_fkey(id, name),
      collector:profiles!collect_funds_collector_id_fkey(id, full_name, username)`
    )
    .eq('id', id)
    .single()

  if (!data) notFound()

  const record = data as CollectWithRelations
  const canEdit =
    isAdmin || (profile.role === 'collecter' && record.collector_id === user.id)

  const fundsArray: FundsItem[] = Array.isArray(record.funds_array)
    ? (record.funds_array as FundsItem[])
    : []

  const collectorName =
    record.collector?.full_name ?? record.collector?.username ?? '不明'

  async function handleDelete() {
    'use server'
    await deleteCollectionAction(id)
  }

  const DENOMINATION_LABELS: Record<string, string> = {
    '10': '10円',
    '50': '50円',
    '100': '100円',
    '500': '500円',
    '1000': '1,000円',
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/collect"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition mb-6"
      >
        ← 集金記録一覧に戻る
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-600">
                {record.laundry_store?.name ?? '不明な店舗'}
              </span>
            </div>
            <p className="text-4xl font-bold text-green-600 mb-3">
              {formatAmount(record.total_funds)}
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateJST(record.collected_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {collectorName}
              </span>
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/dashboard/collect/${id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                編集
              </Link>
              <form action={handleDelete}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  onClick={(e) => {
                    if (!confirm('この集金記録を削除しますか？この操作は取り消せません。')) {
                      e.preventDefault()
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  削除
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown */}
      {fundsArray.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">内訳</h2>
          <div className="space-y-4">
            {fundsArray.map((item) => (
              <div key={item.machine_id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                {item.machine_id !== 'total' && (
                  <div className="flex items-center gap-2 mb-3">
                    <WashingMachine className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-800">{item.name}</span>
                  </div>
                )}

                {item.denominations ? (
                  <>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {(['10', '50', '100', '500', '1000'] as const).map((denom) => {
                        const count = item.denominations![denom] ?? 0
                        return (
                          <div key={denom} className="text-center">
                            <div className="text-xs text-gray-500 mb-1">
                              {DENOMINATION_LABELS[denom]}
                            </div>
                            <div
                              className={`text-sm font-bold py-1.5 rounded-lg ${
                                count > 0
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-gray-100 text-gray-300'
                              }`}
                            >
                              {count}枚
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                      <span className="text-xs text-gray-500">小計</span>
                      <span className="font-bold text-green-600">{formatAmount(item.amount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {item.machine_id === 'total' ? '合計金額' : '金額'}
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total row */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-700">合計</span>
            <span className="text-2xl font-bold text-green-600">
              {formatAmount(record.total_funds)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
