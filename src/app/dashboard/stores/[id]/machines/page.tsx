import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Wrench, AlertTriangle, CheckCircle } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import MachineList from '@/components/machines/MachineList'
import AddMachineForm from '@/components/machines/AddMachineForm'
import type { Machine } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MachinesPage({ params }: PageProps) {
  const { id } = await params
  const { profile } = await getCurrentUserWithOrg()

  const isAdmin = profile.role === 'admin'
  const canEdit = profile.role === 'admin' || profile.role === 'collecter'

  const supabase = await createClient()

  // Fetch store
  const { data: store } = await supabase
    .from('laundry_store')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!store) notFound()

  // Fetch machines ordered by sort_order
  const { data: machines } = await supabase
    .from('machines')
    .select('*')
    .eq('laundry_id', id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const machineList: Machine[] = machines ?? []
  const brokenCount = machineList.filter((m) => m.is_broken).length
  const workingCount = machineList.length - brokenCount

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link
        href={`/dashboard/stores/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition mb-6"
      >
        ← 店舗に戻る
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="h-5 w-5 text-indigo-500" />
            <h1 className="text-2xl font-bold text-gray-900">機器管理</h1>
          </div>
          <p className="text-sm text-gray-500">{store.name}</p>
        </div>
      </div>

      {/* Status summary */}
      {machineList.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-green-600 font-medium">正常稼働</p>
              <p className="text-xl font-bold text-green-700">{workingCount}台</p>
            </div>
          </div>
          <div
            className={`border rounded-xl p-4 flex items-center gap-3 ${
              brokenCount > 0
                ? 'bg-red-50 border-red-100'
                : 'bg-gray-50 border-gray-100'
            }`}
          >
            <AlertTriangle
              className={`h-5 w-5 flex-shrink-0 ${brokenCount > 0 ? 'text-red-500' : 'text-gray-300'}`}
            />
            <div>
              <p className={`text-xs font-medium ${brokenCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                故障中
              </p>
              <p className={`text-xl font-bold ${brokenCount > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                {brokenCount}台
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Machine list */}
      <div className="mb-6">
        <MachineList machines={machineList} isAdmin={isAdmin} canEdit={canEdit} />
      </div>

      {/* Add machine form (admin only) */}
      {isAdmin && <AddMachineForm laundryId={id} />}
    </div>
  )
}
