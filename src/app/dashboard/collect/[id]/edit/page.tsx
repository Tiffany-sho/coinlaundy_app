import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import CollectionForm from '@/components/collect/CollectionForm'
import type { LaundryStore, Machine, CollectFunds } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCollectionPage({ params }: PageProps) {
  const { id } = await params
  const { user, profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin' && profile.role !== 'collecter') {
    redirect('/dashboard/collect')
  }

  const supabase = await createClient()

  const { data: record } = await supabase
    .from('collect_funds')
    .select('*')
    .eq('id', id)
    .single()

  if (!record) notFound()

  const existingRecord = record as CollectFunds

  if (profile.role === 'collecter' && existingRecord.collector_id !== user.id) {
    redirect('/dashboard/collect')
  }

  let stores: LaundryStore[] = []
  if (membership?.org_id) {
    const { data } = await supabase
      .from('laundry_store')
      .select('*')
      .eq('organization_id', membership.org_id)
      .order('name', { ascending: true })
    stores = data ?? []
  }

  let machines: Machine[] = []
  if (profile.collect_method !== 'total') {
    const { data } = await supabase
      .from('machines')
      .select('*')
      .eq('laundry_id', existingRecord.laundry_id)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    machines = data ?? []
  }

  return (
    <div>
      <Link
        href={`/dashboard/collect/${id}`}
        className="inline-flex items-center gap-1 text-sm text-ink-mute hover:text-ink transition mb-6"
      >
        ← 集金記録詳細に戻る
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-medium text-ink tracking-tight">集金記録を編集</h1>
        <p className="mt-1 text-sm text-ink-mute">集金情報を修正できます</p>
      </div>

      <CollectionForm
        stores={stores}
        initialStoreId={existingRecord.laundry_id}
        machines={machines}
        profile={profile}
        initialData={existingRecord}
      />
    </div>
  )
}
