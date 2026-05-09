import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, AlertTriangle, ChevronLeft } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { InventoryType, LaundryStore, LaundryInventory } from '@/types/database'

interface InventoryWithType extends LaundryInventory {
  inventory_types: InventoryType | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StoreInventoryPage({ params }: PageProps) {
  const { id } = await params
  const { profile } = await getCurrentUserWithOrg()
  const isAdmin = profile.role === 'admin'
  const canEdit = isAdmin || profile.role === 'collecter'

  const supabase = await createClient()

  // Fetch store
  const { data: store } = await supabase
    .from('laundry_store')
    .select('*')
    .eq('id', id)
    .single()

  if (!store) notFound()

  // Fetch inventory with types
  const { data: inventoryData } = await supabase
    .from('laundry_inventory')
    .select('*, inventory_types(*)')
    .eq('laundry_id', id)
    .order('created_at', { ascending: true })

  const inventory: InventoryWithType[] = (inventoryData ?? []) as InventoryWithType[]

  const lowStockItems = inventory.filter((inv) => {
    const threshold = inv.inventory_types?.alert_threshold ?? 2
    return inv.quantity < threshold
  })

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link
        href={`/dashboard/stores/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {(store as LaundryStore).name} に戻る
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-teal-50 p-2.5 rounded-xl">
          <Package className="h-6 w-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">在庫管理</h1>
          <p className="text-sm text-gray-500">{(store as LaundryStore).name}</p>
        </div>
      </div>

      {/* Low stock warning */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-800">
              在庫不足 {lowStockItems.length}件
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((inv) => (
              <span
                key={inv.id}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  inv.quantity === 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {inv.inventory_types?.name ?? '不明'}: {inv.quantity}
                {inv.inventory_types?.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory list */}
      {inventory.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">在庫種別が登録されていません。</p>
          {isAdmin && (
            <Link
              href="/dashboard/inventory"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-teal-600 hover:underline"
            >
              在庫種別を管理する
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {inventory.map((inv) => {
            const threshold = inv.inventory_types?.alert_threshold ?? 2
            const isLow = inv.quantity < threshold
            const isCritical = inv.quantity === 0

            return (
              <div
                key={inv.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  isCritical
                    ? 'bg-red-50'
                    : isLow
                    ? 'bg-amber-50'
                    : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {inv.inventory_types?.name ?? '不明'}
                    </span>
                    {isCritical && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        在庫切れ
                      </span>
                    )}
                    {!isCritical && isLow && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        在庫少
                      </span>
                    )}
                  </div>
                  {inv.updated_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      最終更新: {new Date(inv.updated_at).toLocaleDateString('ja-JP')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xl font-bold ${
                      isCritical
                        ? 'text-red-600'
                        : isLow
                        ? 'text-amber-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {inv.quantity}
                    {inv.inventory_types?.unit && (
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        {inv.inventory_types.unit}
                      </span>
                    )}
                  </span>

                  {canEdit && (
                    <Link
                      href="/dashboard/inventory"
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      更新
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Link to global inventory */}
      <div className="mt-6">
        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
        >
          <Package className="h-4 w-4" />
          全店舗の在庫マトリクスを見る
        </Link>
      </div>
    </div>
  )
}
