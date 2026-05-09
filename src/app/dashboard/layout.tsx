import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import DashboardSidebar from './DashboardSidebar'

export const metadata: Metadata = {
  title: 'Collecie - ダッシュボード',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, role')
    .eq('id', user.id)
    .single()

  if (!profile?.role) {
    redirect('/setup')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas-soft">
      <DashboardSidebar
        role={profile.role}
        fullName={profile.full_name}
        username={profile.username}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
