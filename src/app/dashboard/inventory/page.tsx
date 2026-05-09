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
        <div className="bg-canvas-soft p-2.5 rounded-lg border border-hairline">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">在庫管理</h1>
          <p className="mt-0.5 text-sm text-ink-mute">各店舗の在庫数をリアルタイムで確認・更新できます</p>
        </div>
      </div>

      {/* Low stock alert summary */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-[#fffbe0] border-l-4 border-accent-yellow rounded-md p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-accent-yellow flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-ink">在庫不足アラート</h2>
              <p className="text-sm text-ink-mute mt-1">
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
                          ? 'bg-[#ffece8] text-accent-tomato'
                          : 'bg-canvas-soft text-ink-mute'
                      }`}
                    >
                      {storeName} / {inv.inventory_types?.name ?? '不明'}:{' '}
                      {inv.quantity}
                      {inv.inventory_types?.unit}
                    </span>
                  )
                })}
                {lowStockItems.length > 8 && (
                  <span className="text-xs text-ink-mute">他 {lowStockItems.length - 8}件</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matrix */}
      <div className="bg-canvas rounded-lg border border-hairline overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-hairline">
          <h2 className="text-base font-medium text-ink">在庫一覧マトリクス</h2>
          <p className="text-xs text-ink-mute mt-0.5">
            <span className="inline-block w-3 h-3 bg-[#fffbe0] border border-accent-yellow/40 rounded-sm mr-1 align-middle" />
            在庫少
            <span className="inline-block w-3 h-3 bg-[#ffece8] border border-accent-tomato/40 rounded-sm ml-3 mr-1 align-middle" />
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
