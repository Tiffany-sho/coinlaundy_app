import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Pencil, Plus, Wrench, WashingMachine, Package } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DeleteStoreButton from '@/components/stores/DeleteStoreButton'
import type { Machine, LaundryInventory, InventoryType } from '@/types/database'

interface InventoryWithType extends LaundryInventory {
  inventory_types: InventoryType | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StoreDetailPage({ params }: PageProps) {
  const { id } = await params
  const { profile } = await getCurrentUserWithOrg()
  const isAdmin = profile.role === 'admin'

  const supabase = await createClient()

  const { data: store } = await supabase
    .from('laundry_store')
    .select('*')
    .eq('id', id)
    .single()

  if (!store) notFound()

  const { data: machines } = await supabase
    .from('machines')
    .select('*')
    .eq('laundry_id', id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const machineList: Machine[] = machines ?? []

  const { data: inventory } = await supabase
    .from('laundry_inventory')
    .select('*, inventory_types(*)')
    .eq('laundry_id', id)

  const inventoryList: InventoryWithType[] = (inventory ?? []) as InventoryWithType[]

  const totalMachines = machineList.length
  const brokenMachines = machineList.filter((m) => m.is_broken).length
  const imageUrls: string[] = Array.isArray(store.images) ? (store.images as string[]) : []

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard/stores"
        className="inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink transition mb-6"
      >
        ← 店舗一覧に戻る
      </Link>

      <div className="bg-canvas rounded-lg border border-hairline p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-medium text-ink tracking-tight">{store.name}</h1>
            {store.location && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-ink-mute">
                <MapPin className="h-4 w-4 flex-shrink-0 text-ink-faint" />
                <span>{store.location}</span>
              </div>
            )}
            {store.description && (
              <p className="mt-3 text-sm text-ink-mute">{store.description}</p>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/dashboard/stores/${id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ink bg-canvas border border-hairline hover:bg-canvas-soft rounded-sm transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                編集
              </Link>
              <DeleteStoreButton storeId={id} storeName={store.name} />
            </div>
          )}
        </div>

        {imageUrls.length > 0 && (
          <div className="mt-4 flex gap-3 flex-wrap">
            {imageUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`${store.name} 画像 ${i + 1}`}
                className="w-32 h-32 object-cover rounded-md border border-hairline"
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-canvas rounded-lg border border-hairline p-4 flex items-center gap-3">
          <div className="bg-canvas-soft p-2.5 rounded-lg">
            <WashingMachine className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-ink-mute">機器数</p>
            <p className="text-xl font-medium text-ink">{totalMachines}台</p>
          </div>
        </div>

        <div className="bg-canvas rounded-lg border border-hairline p-4 flex items-center gap-3">
          <div className={`${brokenMachines > 0 ? 'bg-[#ffece8]' : 'bg-canvas-soft'} p-2.5 rounded-lg`}>
            <Wrench className={`h-5 w-5 ${brokenMachines > 0 ? 'text-accent-tomato' : 'text-ink-faint'}`} />
          </div>
          <div>
            <p className="text-xs text-ink-mute">故障中</p>
            <p className={`text-xl font-medium ${brokenMachines > 0 ? 'text-accent-tomato' : 'text-ink'}`}>
              {brokenMachines}台
            </p>
          </div>
        </div>

        <div className="bg-canvas rounded-lg border border-hairline p-4 flex items-center gap-3">
          <div className="bg-canvas-soft p-2.5 rounded-lg">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-ink-mute">在庫種類</p>
            <p className="text-xl font-medium text-ink">{inventoryList.length}種</p>
          </div>
        </div>
      </div>

      <div className="bg-canvas rounded-lg border border-hairline p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-ink">機器一覧</h2>
          <Link
            href={`/dashboard/stores/${id}/machines`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-ink-mute bg-canvas-soft hover:bg-canvas border border-hairline rounded-sm transition"
          >
            <Wrench className="h-3.5 w-3.5" />
            機器管理
          </Link>
        </div>
        {machineList.length === 0 ? (
          <p className="text-sm text-ink-faint">機器がまだ登録されていません。</p>
        ) : (
          <div className="space-y-2">
            {machineList.map((machine) => (
              <div
                key={machine.id}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  machine.is_broken
                    ? 'border-accent-tomato/30 bg-[#fff3f0]'
                    : 'border-hairline bg-canvas-soft'
                }`}
              >
                <div className="flex items-center gap-3">
                  <WashingMachine className={`h-4 w-4 flex-shrink-0 ${machine.is_broken ? 'text-accent-tomato' : 'text-ink-faint'}`} />
                  <div>
                    <span className="text-sm font-medium text-ink">{machine.name}</span>
                    <span className="ml-2 text-xs text-ink-mute">×{machine.unit_count}台</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {machine.is_broken && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ffece8] text-accent-tomato text-xs font-medium rounded-full">
                      <Wrench className="h-3 w-3" />
                      故障中
                    </span>
                  )}
                  {machine.comment && (
                    <span className="text-xs text-ink-mute max-w-[160px] truncate">{machine.comment}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-canvas rounded-lg border border-hairline p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-ink">在庫</h2>
          <Link
            href={`/dashboard/stores/${id}/inventory`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-ink-mute bg-canvas-soft hover:bg-canvas border border-hairline rounded-sm transition"
          >
            <Package className="h-3.5 w-3.5" />
            在庫管理
          </Link>
        </div>
        {inventoryList.length === 0 ? (
          <p className="text-sm text-ink-faint">在庫種別が登録されていません。</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {inventoryList.map((inv) => (
              <div key={inv.id} className="p-3 rounded-md bg-canvas-soft border border-hairline">
                <p className="text-xs text-ink-mute mb-1">{inv.inventory_types?.name ?? '不明'}</p>
                <p className="text-lg font-medium text-ink">
                  {inv.quantity}
                  {inv.inventory_types?.unit && (
                    <span className="text-sm font-normal text-ink-mute ml-1">{inv.inventory_types.unit}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href={`/dashboard/collect?store=${id}`}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-deep text-on-primary text-sm font-medium px-5 py-2.5 rounded-sm transition"
        >
          <Plus className="h-4 w-4" />
          集金記録を追加
        </Link>
      </div>
    </div>
  )
}
