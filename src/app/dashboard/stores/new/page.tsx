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
        <h1 className="text-2xl font-bold text-gray-900">新規店舗追加</h1>
        <p className="mt-1 text-sm text-gray-500">
          新しい店舗の情報を入力してください
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <StoreForm mode="create" />
      </div>
    </div>
  )
}
