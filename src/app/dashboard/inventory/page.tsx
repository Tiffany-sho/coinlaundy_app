import { Package, AlertTriangle } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import InventoryMatrix from '@/components/inventory/InventoryMatrix'
import InventoryTypeManager from '@/components/inventory/InventoryTypeManager'
import type { InventoryType, LaundryStore, LaundryInventory } from '@/types/database'

interface InventoryWithType extends LaundryInventory {
  inventory_types: InventoryType | null
}

interface StoreInventory {
  store: LaundryStore
  inventory: InventoryWithType[]
}

export default async function InventoryPage() {
  const { profile, membership } = await getCurrentUserWithOrg()
  const isAdmin = profile.role === 'admin'

  const supabase = await createClient()

  let stores: LaundryStore[] = []
  let inventoryTypes: InventoryType[] = []
  let allInventory: InventoryWithType[] = []

  if (membership?.org_id) {
    const [storesResult, typesResult] = await Promise.all([
      supabase
        .from('laundry_store')
        .select('*')
        .eq('organization_id', membership.org_id)
        .order('created_at', { ascending: true }),
      supabase
        .from('inventory_types')
        .select('*')
        .eq('org_id', membership.org_id)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true }),
    ])

    stores = (storesResult.data ?? []) as LaundryStore[]
    inventoryTypes = (typesResult.data ?? []) as InventoryType[]

    // Fetch inventory for all stores
    if (stores.length > 0) {
      const storeIds = stores.map((s) => s.id)
      const { data: inventoryData } = await supabase
        .from('laundry_inventory')
        .select('*, inventory_types(*)')
        .in('laundry_id', storeIds)

      allInventory = (inventoryData ?? []) as InventoryWithType[]
    }
  }

  // Build store × inventory map
  const storeInventories: StoreInventory[] = stores.map((store) => ({
    store,
    inventory: allInventory.filter((inv) => inv.laundry_id === store.id),
  }))

  // Compute low stock items
  const lowStockItems = allInventory.filter((inv) => {
    const threshold = (inv.inventory_types?.alert_threshold ?? 2)
    return inv.quantity < threshold
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-teal-50 p-2.5 rounded-xl">
          <Package className="h-6 w-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">在庫管理</h1>
          <p className="mt-0.5 text-sm text-gray-500">各店舗の在庫数をリアルタイムで確認・更新できます</p>
        </div>
      </div>

      {/* Low stock alert summary */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-amber-800">在庫不足アラート</h2>
              <p className="text-sm text-amber-700 mt-1">
                {lowStockItems.length}件の在庫が閾値を下回っています。
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowStockItems.slice(0, 8).map((inv) => {
                  const storeName = stores.find((s) => s.id === inv.laundry_id)?.name ?? '不明'
                  return (
                    <span
                      key={inv.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        inv.quantity === 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {storeName} / {inv.inventory_types?.name ?? '不明'}:{' '}
                      {inv.quantity}
                      {inv.inventory_types?.unit}
                    </span>
                  )
                })}
                {lowStockItems.length > 8 && (
                  <span className="text-xs text-amber-600">他 {lowStockItems.length - 8}件</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">在庫一覧マトリクス</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="inline-block w-3 h-3 bg-amber-100 border border-amber-300 rounded-sm mr-1 align-middle" />
            在庫少
            <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded-sm ml-3 mr-1 align-middle" />
            在庫切れ
          </p>
        </div>
        <InventoryMatrix stores={storeInventories} inventoryTypes={inventoryTypes} />
      </div>

      {/* Admin: inventory type management */}
      {isAdmin && (
        <InventoryTypeManager inventoryTypes={inventoryTypes} />
      )}
    </div>
  )
}
