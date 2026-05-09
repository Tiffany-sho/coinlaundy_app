import { redirect } from 'next/navigation'
import { getCurrentUserWithOrg } from '@/lib/auth'
import StoreForm from '@/components/stores/StoreForm'

export default async function NewStorePage() {
  const { profile } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    redirect('/dashboard/stores')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-ink tracking-tight">新規店舗追加</h1>
        <p className="mt-1 text-sm text-ink-mute">
          新しい店舗の情報を入力してください
        </p>
      </div>

      <div className="bg-canvas rounded-lg border border-hairline p-6">
        <StoreForm mode="create" />
      </div>
    </div>
  )
}
