import { User } from 'lucide-react'
import { getCurrentUserWithOrg } from '@/lib/auth'
import ProfileForm from './ProfileForm'
import type { Profile } from '@/types/database'

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserWithOrg()

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-canvas-soft p-2.5 rounded-lg border border-hairline">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">プロフィール設定</h1>
          <p className="mt-0.5 text-sm text-ink-mute">アカウント情報と集金設定を管理します</p>
        </div>
      </div>

      <ProfileForm profile={profile as Profile} email={user.email ?? ''} />
    </div>
  )
}
