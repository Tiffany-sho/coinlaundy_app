import { notFound, redirect } from 'next/navigation'
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

  // Fetch store
  const { data: store } = await supabase
    .from('laundry_store')
    .select('*')
    .eq('id', id)
    .single()

  if (!store) notFound()

  // Fetch machines
  const { data: machines } = await supabase
    .from('machines')
    .select('*')
    .eq('laundry_id', id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const machineList: Machine[] = machines ?? []

  // Fetch inventory with types
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
      {/* Back link */}
      <Link
        href="/dashboard/stores"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition mb-6"
      >
        ← 店舗一覧に戻る
      </Link>

      {/* Store header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
            {store.location && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                <span>{store.location}</span>
              </div>
            )}
            {store.description && (
              <p className="mt-3 text-sm text-gray-600">{store.description}</p>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/dashboard/stores/${id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                編集
              </Link>
              <DeleteStoreButton storeId={id} storeName={store.name} />
            </div>
          )}
        </div>

        {/* Images */}
        {imageUrls.length > 0 && (
          <div className="mt-4 flex gap-3 flex-wrap">
            {imageUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`${store.name} 画像 ${i + 1}`}
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
          <div className="bg-blue-50 p-2.5 rounded-lg">
            <WashingMachine className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">機器数</p>
            <p className="text-xl font-bold text-gray-900">{totalMachines}台</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
          <div className={`${brokenMachines > 0 ? 'bg-red-50' : 'bg-gray-50'} p-2.5 rounded-lg`}>
            <Wrench className={`h-5 w-5 ${brokenMachines > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500">故障中</p>
            <p className={`text-xl font-bold ${brokenMachines > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {brokenMachines}台
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
          <div className="bg-teal-50 p-2.5 rounded-lg">
            <Package className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">在庫種類</p>
            <p className="text-xl font-bold text-gray-900">{inventoryList.length}種</p>
          </div>
        </div>
      </div>

      {/* Machines section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">機器一覧</h2>
          <Link
            href={`/dashboard/stores/${id}/machines`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
          >
            <Wrench className="h-3.5 w-3.5" />
            機器管理
          </Link>
        </div>
        {machineList.length === 0 ? (
          <p className="text-sm text-gray-400">機器がまだ登録されていません。</p>
        ) : (
          <div className="space-y-2">
            {machineList.map((machine) => (
              <div
                key={machine.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  machine.is_broken
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <WashingMachine className={`h-4 w-4 flex-shrink-0 ${machine.is_broken ? 'text-red-400' : 'text-gray-400'}`} />
                  <div>
                    <span className="text-sm font-medium text-gray-800">{machine.name}</span>
                    <span className="ml-2 text-xs text-gray-500">×{machine.unit_count}台</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {machine.is_broken && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      <Wrench className="h-3 w-3" />
                      故障中
                    </span>
                  )}
                  {machine.comment && (
                    <span className="text-xs text-gray-400 max-w-[160px] truncate">{machine.comment}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">在庫</h2>
          <Link
            href={`/dashboard/stores/${id}/inventory`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
          >
            <Package className="h-3.5 w-3.5" />
            在庫管理
          </Link>
        </div>
        {inventoryList.length === 0 ? (
          <p className="text-sm text-gray-400">在庫種別が登録されていません。</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {inventoryList.map((inv) => (
              <div key={inv.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">{inv.inventory_types?.name ?? '不明'}</p>
                <p className="text-lg font-bold text-gray-900">
                  {inv.quantity}
                  {inv.inventory_types?.unit && (
                    <span className="text-sm font-normal text-gray-500 ml-1">{inv.inventory_types.unit}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="flex gap-3">
        <Link
          href={`/dashboard/collect?store=${id}`}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          集金記録を追加
        </Link>
      </div>
    </div>
  )
}
