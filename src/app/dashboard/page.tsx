import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Store, Wrench, AlertTriangle, Wallet, Plus } from 'lucide-react'
import AlertBanner from '@/components/alerts/AlertBanner'
import QuickActionButtons from '@/components/dashboard/QuickActionButtons'
import type { InventoryType, LaundryInventory } from '@/types/database'

interface InventoryWithType extends LaundryInventory {
  inventory_types: InventoryType | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, role')
    .eq('id', user.id)
    .single()

  const { data: memberRecord } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let orgName: string | null = null
  let storeCount = 0
  let brokenMachineCount = 0
  let lowInventoryCount = 0
  let quickStores: { id: string; name: string }[] = []

  type BrokenMachine = { id: string; name: string; storeName: string }
  type LowInventoryItem = { id: string; typeName: string; storeName: string; quantity: number }

  const brokenMachines: BrokenMachine[] = []
  const lowInventoryItems: LowInventoryItem[] = []

  if (memberRecord?.org_id) {
    const { data: org } = await supabase.from('organizations').select('name').eq('id', memberRecord.org_id).single()
    orgName = org?.name ?? null

    const { data: stores, count: storeCountResult } = await supabase
      .from('laundry_store')
      .select('id, name', { count: 'exact' })
      .eq('organization_id', memberRecord.org_id)
      .order('created_at', { ascending: true })

    storeCount = storeCountResult ?? 0
    quickStores = (stores ?? []) as { id: string; name: string }[]

    if (stores && stores.length > 0) {
      const storeIds = stores.map((s) => s.id)
      const storeMap = Object.fromEntries(stores.map((s) => [s.id, s.name]))

      const { data: brokenData } = await supabase
        .from('machines')
        .select('id, name, laundry_id')
        .eq('is_broken', true)
        .in('laundry_id', storeIds)

      if (brokenData) {
        brokenMachineCount = brokenData.length
        brokenData.forEach((m) => {
          brokenMachines.push({ id: m.id, name: m.name, storeName: storeMap[m.laundry_id] ?? '不明' })
        })
      }

      const { data: inventoryData } = await supabase
        .from('laundry_inventory')
        .select('*, inventory_types(*)')
        .in('laundry_id', storeIds)

      if (inventoryData) {
        const typed = inventoryData as InventoryWithType[]
        const lowItems = typed.filter((inv) => {
          const threshold = inv.inventory_types?.alert_threshold ?? 2
          return inv.quantity < threshold
        })
        lowInventoryCount = lowItems.length
        lowItems.forEach((inv) => {
          lowInventoryItems.push({
            id: inv.id,
            typeName: inv.inventory_types?.name ?? '不明',
            storeName: storeMap[inv.laundry_id] ?? '不明',
            quantity: inv.quantity,
          })
        })
      }
    }
  }

  const displayName = profile?.full_name ?? profile?.username ?? 'ユーザー'

  return (
    <div>
      <AlertBanner brokenMachines={brokenMachines} lowInventoryItems={lowInventoryItems} />

      <div className="mb-8">
        <h1 className="text-2xl font-medium text-ink tracking-tight">
          おかえりなさい、{displayName}さん
        </h1>
        {orgName && <p className="mt-1 text-sm text-ink-mute">{orgName}</p>}
      </div>

      {storeCount > 0 && <QuickActionButtons stores={quickStores} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Wallet className="h-6 w-6 text-primary" />}
          label="今月の集金額"
          value="—"
          placeholder
        />
        <StatCard
          icon={<Store className="h-6 w-6 text-primary" />}
          label="登録店舗数"
          value={storeCount.toString()}
        />
        <StatCard
          icon={<Wrench className="h-6 w-6 text-primary" />}
          label="故障中機器"
          value={brokenMachineCount > 0 ? brokenMachineCount.toString() : '—'}
          placeholder={brokenMachineCount === 0}
          alert={brokenMachineCount > 0}
        />
        <StatCard
          icon={<AlertTriangle className="h-6 w-6 text-primary" />}
          label="低在庫アラート"
          value={lowInventoryCount > 0 ? lowInventoryCount.toString() : '—'}
          placeholder={lowInventoryCount === 0}
          alert={lowInventoryCount > 0}
        />
      </div>

      {storeCount === 0 && (
        <div className="rounded-lg border-2 border-dashed border-hairline bg-canvas p-10 text-center">
          <Store className="mx-auto h-12 w-12 text-ink-faint mb-4" />
          <h3 className="text-lg font-medium text-ink mb-1">まず店舗を登録しましょう</h3>
          <p className="text-sm text-ink-mute mb-5">
            店舗を登録すると、集金記録や在庫管理が始められます。
          </p>
          <Link
            href="/dashboard/stores/new"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-deep text-on-primary text-sm font-medium px-5 py-2.5 rounded-sm transition"
          >
            <Plus className="h-4 w-4" />
            店舗を登録する
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon, label, value, placeholder, alert,
}: {
  icon: React.ReactNode
  label: string
  value: string
  placeholder?: boolean
  alert?: boolean
}) {
  return (
    <div className="bg-canvas rounded-lg border border-hairline p-5 flex items-center gap-4">
      <div className="bg-canvas-soft p-3 rounded-lg flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-ink-mute mb-0.5">{label}</p>
        <p className={`text-2xl font-medium ${placeholder ? 'text-ink-faint' : alert ? 'text-accent-tomato' : 'text-ink'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
