import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Store, Wrench, AlertTriangle, Wallet, Plus } from 'lucide-react'
import AlertBanner from '@/components/alerts/AlertBanner'
import type { InventoryType, LaundryInventory } from '@/types/database'

interface InventoryWithType extends LaundryInventory {
  inventory_types: InventoryType | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, role')
    .eq('id', user.id)
    .single()

  // Fetch organization (user is a member of)
  const { data: memberRecord } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let orgName: string | null = null
  let storeCount = 0
  let brokenMachineCount = 0
  let lowInventoryCount = 0

  type BrokenMachine = { id: string; name: string; storeName: string }
  type LowInventoryItem = { id: string; typeName: string; storeName: string; quantity: number }

  const brokenMachines: BrokenMachine[] = []
  const lowInventoryItems: LowInventoryItem[] = []

  if (memberRecord?.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', memberRecord.org_id)
      .single()
    orgName = org?.name ?? null

    // Fetch stores
    const { data: stores, count: storeCountResult } = await supabase
      .from('laundry_store')
      .select('id, name', { count: 'exact' })
      .eq('organization_id', memberRecord.org_id)

    storeCount = storeCountResult ?? 0

    if (stores && stores.length > 0) {
      const storeIds = stores.map((s) => s.id)
      const storeMap = Object.fromEntries(stores.map((s) => [s.id, s.name]))

      // Fetch broken machines via laundry_store organization join
      const { data: brokenData } = await supabase
        .from('machines')
        .select('id, name, laundry_id')
        .eq('is_broken', true)
        .in('laundry_id', storeIds)

      if (brokenData) {
        brokenMachineCount = brokenData.length
        brokenData.forEach((m) => {
          brokenMachines.push({
            id: m.id,
            name: m.name,
            storeName: storeMap[m.laundry_id] ?? '不明',
          })
        })
      }

      // Fetch low inventory
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
      {/* Alert banners */}
      <AlertBanner brokenMachines={brokenMachines} lowInventoryItems={lowInventoryItems} />

      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          おかえりなさい、{displayName}さん
        </h1>
        {orgName && (
          <p className="mt-1 text-sm text-gray-500">{orgName}</p>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Wallet className="h-6 w-6 text-indigo-600" />}
          label="今月の集金額"
          value="—"
          bgColor="bg-indigo-50"
          placeholder
        />
        <StatCard
          icon={<Store className="h-6 w-6 text-teal-600" />}
          label="登録店舗数"
          value={storeCount.toString()}
          bgColor="bg-teal-50"
        />
        <StatCard
          icon={<Wrench className="h-6 w-6 text-orange-500" />}
          label="故障中機器"
          value={brokenMachineCount > 0 ? brokenMachineCount.toString() : '—'}
          bgColor="bg-orange-50"
          placeholder={brokenMachineCount === 0}
          alert={brokenMachineCount > 0}
        />
        <StatCard
          icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
          label="低在庫アラート"
          value={lowInventoryCount > 0 ? lowInventoryCount.toString() : '—'}
          bgColor="bg-red-50"
          placeholder={lowInventoryCount === 0}
          alert={lowInventoryCount > 0}
        />
      </div>

      {/* Empty state if no stores */}
      {storeCount === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Store className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            まず店舗を登録しましょう
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            店舗を登録すると、集金記録や在庫管理が始められます。
          </p>
          <Link
            href="/dashboard/stores/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
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
  icon,
  label,
  value,
  bgColor,
  placeholder,
  alert,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bgColor: string
  placeholder?: boolean
  alert?: boolean
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`${bgColor} p-3 rounded-xl flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className={`text-2xl font-bold ${placeholder ? 'text-gray-300' : alert ? 'text-red-600' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
