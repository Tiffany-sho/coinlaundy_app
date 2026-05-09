import Link from 'next/link'
import { MapPin, Plus, Store, Wrench, WashingMachine } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { LaundryStore, Machine } from '@/types/database'

interface StoreWithMachines extends LaundryStore {
  machines: Machine[]
}

export default async function StoresPage() {
  const { profile, membership } = await getCurrentUserWithOrg()
  const isAdmin = profile.role === 'admin'

  const supabase = await createClient()

  let stores: StoreWithMachines[] = []

  if (membership?.org_id) {
    const { data } = await supabase
      .from('laundry_store')
      .select('*, machines(*)')
      .eq('organization_id', membership.org_id)
      .order('created_at', { ascending: false })

    stores = (data ?? []) as StoreWithMachines[]
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">店舗管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            登録されている店舗の一覧です
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/stores/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            新規店舗追加
          </Link>
        )}
      </div>

      {/* Store Grid */}
      {stores.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <Store className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            店舗がまだ登録されていません
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            店舗を登録すると、集金記録や在庫管理が始められます。
          </p>
          {isAdmin && (
            <Link
              href="/dashboard/stores/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
            >
              <Plus className="h-4 w-4" />
              最初の店舗を登録する
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {stores.map((store) => {
            const totalMachines = store.machines.length
            const brokenMachines = store.machines.filter((m) => m.is_broken).length

            return (
              <Link
                key={store.id}
                href={`/dashboard/stores/${store.id}`}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                        {store.name}
                      </h2>
                      {store.location && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
                          <span className="truncate">{store.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 bg-white rounded-lg p-2 shadow-sm">
                      <Store className="h-5 w-5 text-indigo-500" />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Machine count badge */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      <WashingMachine className="h-3.5 w-3.5" />
                      {totalMachines}台
                    </span>

                    {/* Broken machine badge */}
                    {brokenMachines > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
                        <Wrench className="h-3.5 w-3.5" />
                        故障中 {brokenMachines}台
                      </span>
                    )}

                    {totalMachines === 0 && (
                      <span className="text-xs text-gray-400">機器未登録</span>
                    )}
                  </div>

                  {store.description && (
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                      {store.description}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
