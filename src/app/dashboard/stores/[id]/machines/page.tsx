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

  const { data: store } = await supabase
    .from('laundry_store')
    .select('id, name')
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
  const brokenCount = machineList.filter((m) => m.is_broken).length
  const workingCount = machineList.length - brokenCount

  return (
    <div className="max-w-3xl">
      <Link
        href={`/dashboard/stores/${id}`}
        className="inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink transition mb-6"
      >
        ← 店舗に戻る
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-medium text-ink tracking-tight">機器管理</h1>
          </div>
          <p className="text-sm text-ink-mute">{store.name}</p>
        </div>
      </div>

      {machineList.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-canvas-soft border border-hairline rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-mute font-medium">正常稼働</p>
              <p className="text-xl font-medium text-ink">{workingCount}台</p>
            </div>
          </div>
          <div
            className={`border rounded-lg p-4 flex items-center gap-3 ${
              brokenCount > 0
                ? 'bg-[#fff3f0] border-accent-tomato/30'
                : 'bg-canvas-soft border-hairline'
            }`}
          >
            <AlertTriangle
              className={`h-5 w-5 flex-shrink-0 ${brokenCount > 0 ? 'text-accent-tomato' : 'text-ink-faint'}`}
            />
            <div>
              <p className={`text-xs font-medium ${brokenCount > 0 ? 'text-accent-tomato' : 'text-ink-mute'}`}>
                故障中
              </p>
              <p className={`text-xl font-medium ${brokenCount > 0 ? 'text-accent-tomato' : 'text-ink-faint'}`}>
                {brokenCount}台
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <MachineList machines={machineList} isAdmin={isAdmin} canEdit={canEdit} />
      </div>

      {isAdmin && <AddMachineForm laundryId={id} />}
    </div>
  )
}
