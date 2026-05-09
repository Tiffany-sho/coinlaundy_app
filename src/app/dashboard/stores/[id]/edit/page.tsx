import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import StoreForm from '@/components/stores/StoreForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditStorePage({ params }: PageProps) {
  const { id } = await params
  const { profile } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    redirect('/dashboard/stores')
  }

  const supabase = await createClient()

  const { data: store } = await supabase
    .from('laundry_store')
    .select('*')
    .eq('id', id)
    .single()

  if (!store) notFound()

  return (
    <div>
      <div className="mb-2">
        <Link
          href={`/dashboard/stores/${id}`}
          className="text-sm text-ink-mute hover:text-ink transition"
        >
          ← 店舗詳細に戻る
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-ink tracking-tight">店舗情報を編集</h1>
        <p className="mt-1 text-sm text-ink-mute">{store.name}</p>
      </div>

      <div className="bg-canvas rounded-lg border border-hairline p-6">
        <StoreForm mode="edit" store={store} />
      </div>
    </div>
  )
}
