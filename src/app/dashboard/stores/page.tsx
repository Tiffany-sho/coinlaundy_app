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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">店舗管理</h1>
          <p className="mt-1 text-sm text-ink-mute">登録されている店舗の一覧です</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/stores/new"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-deep text-on-primary text-sm font-medium px-4 py-2.5 rounded-sm transition"
          >
            <Plus className="h-4 w-4" />
            新規店舗追加
          </Link>
        )}
      </div>

      {stores.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-hairline bg-canvas p-12 text-center">
          <Store className="mx-auto h-12 w-12 text-ink-faint mb-4" />
          <h3 className="text-lg font-medium text-ink mb-1">
            店舗がまだ登録されていません
          </h3>
          <p className="text-sm text-ink-mute mb-6">
            店舗を登録すると、集金記録や在庫管理が始められます。
          </p>
          {isAdmin && (
            <Link
              href="/dashboard/stores/new"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-deep text-on-primary text-sm font-medium px-5 py-2.5 rounded-sm transition"
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
            const imageUrls: string[] = Array.isArray(store.images) ? (store.images as string[]) : []
            const firstImage = imageUrls[0] ?? null

            return (
              <Link
                key={store.id}
                href={`/dashboard/stores/${store.id}`}
                className="group bg-canvas rounded-lg border border-hairline hover:border-hairline-strong hover:shadow-sm transition-all duration-200 overflow-hidden"
              >
                <div className="relative h-40 overflow-hidden bg-canvas-soft">
                  {firstImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={firstImage}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="h-14 w-14 text-ink-faint" />
                    </div>
                  )}

                  {brokenMachines > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-tomato text-on-dark text-xs font-medium rounded-full">
                        <Wrench className="h-3 w-3" />
                        故障 {brokenMachines}台
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-5 py-4">
                  <h2 className="text-base font-medium text-ink truncate group-hover:text-primary transition-colors mb-1">
                    {store.name}
                  </h2>
                  {store.location && (
                    <div className="flex items-center gap-1.5 text-sm text-ink-mute mb-3">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
                      <span className="truncate">{store.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-canvas-soft text-ink-mute text-xs font-medium rounded-full">
                      <WashingMachine className="h-3.5 w-3.5" />
                      {totalMachines}台
                    </span>
                    {totalMachines === 0 && (
                      <span className="text-xs text-ink-faint">機器未登録</span>
                    )}
                  </div>

                  {store.description && (
                    <p className="mt-2 text-sm text-ink-mute line-clamp-2">{store.description}</p>
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
