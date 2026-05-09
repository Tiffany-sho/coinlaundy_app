import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SetupForm from './SetupForm'

export default async function SetupPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-700 tracking-tight">Collecie</h1>
        <p className="mt-2 text-sm text-gray-500">コインランドリー集金管理</p>
      </div>
      <SetupForm />
    </div>
  )
}
