import { redirect } from 'next/navigation'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import MemberList from '@/components/members/MemberList'
import InviteForm from '@/components/members/InviteForm'

export const metadata = {
  title: 'Collecie - メンバー管理',
}

export default async function MembersPage() {
  const { user, profile, membership } = await getCurrentUserWithOrg()

  // Admin-only page
  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const orgId = membership?.org_id
  if (!orgId) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // Fetch org to get owner_id
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, owner_id')
    .eq('id', orgId)
    .single()

  const orgOwnerId = org?.owner_id ?? ''

  // Fetch all members with their profiles
  const { data: memberRows } = await supabase
    .from('organization_members')
    .select('id, user_id, role, joined_at')
    .eq('org_id', orgId)
    .order('joined_at', { ascending: true })

  const memberList = memberRows ?? []

  // Fetch profiles for all member user IDs
  const userIds = memberList.map((m) => m.user_id)
  const profileMap: Record<string, { full_name: string | null; username: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', userIds)
    if (profiles) {
      for (const p of profiles) {
        profileMap[p.id] = { full_name: p.full_name, username: p.username }
      }
    }
  }

  // Fetch emails via auth.users — use admin client or fall back to auth.getUser per member
  // Since we can't call admin API in the server component directly without service role,
  // we get the current user's email from auth and use email from invitations for others.
  // We use auth.admin.listUsers if service role key is available, otherwise use profile username as fallback.
  const emailMap: Record<string, string> = {}
  // Try to get emails from auth admin API
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (serviceRoleKey && supabaseUrl && userIds.length > 0) {
    try {
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const adminClient = createAdminClient(supabaseUrl, serviceRoleKey)
      const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      if (usersData?.users) {
        for (const u of usersData.users) {
          if (userIds.includes(u.id) && u.email) {
            emailMap[u.id] = u.email
          }
        }
      }
    } catch {
      // Service role not available, fall back to empty
    }
  }
  // Always include current user's own email
  emailMap[user.id] = user.email ?? ''

  // Build members array
  const members = memberList.map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role as 'admin' | 'collecter' | 'viewer',
    joined_at: m.joined_at,
    email: emailMap[m.user_id] ?? profileMap[m.user_id]?.username ?? '',
    full_name: profileMap[m.user_id]?.full_name ?? null,
    username: profileMap[m.user_id]?.username ?? null,
    is_owner: m.user_id === orgOwnerId,
  }))

  // Fetch pending invitations (not accepted, not expired)
  const { data: invitations } = await supabase
    .from('organization_invitations')
    .select('id, email, role, expires_at, created_at')
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const pendingInvitations = (invitations ?? []).map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role as 'admin' | 'collecter' | 'viewer',
    expires_at: inv.expires_at,
    created_at: inv.created_at,
  }))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-canvas-soft p-2.5 rounded-lg border border-hairline">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-medium text-ink tracking-tight">メンバー管理</h1>
          {org?.name && (
            <p className="mt-0.5 text-sm text-ink-mute">{org.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Members list */}
        <div className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium text-ink">
              現在のメンバー
              <span className="ml-2 text-sm font-normal text-ink-mute">({members.length}人)</span>
            </h2>
          </div>
          <MemberList
            members={members}
            currentUserId={user.id}
            orgOwnerId={orgOwnerId}
          />
        </div>

        {/* Invite form + pending invites */}
        <div className="xl:col-span-1">
          <InviteForm pendingInvitations={pendingInvitations} />
        </div>
      </div>
    </div>
  )
}
