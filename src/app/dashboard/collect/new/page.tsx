import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import CollectionForm from '@/components/collect/CollectionForm'
import type { LaundryStore, Machine } from '@/types/database'

interface PageProps {
  searchParams: Promise<{ store?: string }>
}

export default async function NewCollectionPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin' && profile.role !== 'collecter') {
    redirect('/dashboard/collect')
  }

  const supabase = await createClient()

  let stores: LaundryStore[] = []
  if (membership?.org_id) {
    const { data } = await supabase
      .from('laundry_store')
      .select('*')
      .eq('organization_id', membership.org_id)
      .order('name', { ascending: true })
    stores = data ?? []
  }

  const initialStoreId = params.store ?? stores[0]?.id ?? ''

  // Fetch machines for initial store
  let machines: Machine[] = []
  if (initialStoreId && profile.collect_method !== 'total') {
    const { data } = await supabase
      .from('machines')
      .select('*')
      .eq('laundry_id', initialStoreId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    machines = data ?? []
  }

  return (
    <div>
      <Link
        href="/dashboard/collect"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition mb-6"
      >
        ← 集金記録一覧に戻る
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">集金を記録する</h1>
        <p className="mt-1 text-sm text-gray-500">集金金額を入力してください</p>
      </div>

      <CollectionForm
        stores={stores}
        initialStoreId={params.store}
        machines={machines}
        profile={profile}
      />
    </div>
  )
}
