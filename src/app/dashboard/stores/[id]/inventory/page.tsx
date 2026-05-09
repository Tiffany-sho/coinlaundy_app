import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, AlertTriangle, ChevronLeft } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import StoreInventoryEditor from '@/components/inventory/StoreInventoryEditor'
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

  const { data: store } = await supabase
    .from('laundry_store')
    .select('*')
    .eq('id', id)
    .single()

  if (!store) notFound()

  const { data: inventoryData } = await supabase
    .from('laundry_inventory')
    .select('*, inventory_types(*)')
    .eq('laundry_id', id)

  const inventory: InventoryWithType[] = (inventoryData ?? []) as InventoryWithType[]

  const lowStockItems = inventory.filter((inv) => {
    const threshold = inv.inventory_types?.alert_threshold ?? 2
    return inv.quantity < threshold
  })

  return (
    <div className="max-w-3xl">
      <Link
        href={`/dashboard/stores/${id}`}
        className="inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink transition mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {(store as LaundryStore).name} に戻る
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-canvas-soft p-2.5 rounded-lg border border-hairline">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-medium text-ink tracking-tight">在庫管理</h1>
          <p className="text-sm text-ink-mute">{(store as LaundryStore).name}</p>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-[#fffbe0] border-l-4 border-accent-yellow rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-ink-mute flex-shrink-0" />
            <span className="text-sm font-medium text-ink">
              在庫不足 {lowStockItems.length}件
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((inv) => (
              <span
                key={inv.id}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  inv.quantity === 0
                    ? 'bg-[#ffece8] text-accent-tomato'
                    : 'bg-canvas-soft text-ink-mute'
                }`}
              >
                {inv.inventory_types?.name ?? '不明'}: {inv.quantity}
                {inv.inventory_types?.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <StoreInventoryEditor inventory={inventory} canEdit={canEdit} />
      </div>

      {isAdmin && inventory.length === 0 && (
        <div className="text-center mt-2">
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center gap-1.5 text-sm text-ink underline hover:text-ink-mute"
          >
            在庫種別を管理する
          </Link>
        </div>
      )}

      <div className="mt-4">
        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 text-sm text-ink underline hover:text-ink-mute"
        >
          <Package className="h-4 w-4" />
          全店舗の在庫マトリクスを見る
        </Link>
      </div>
    </div>
  )
}
