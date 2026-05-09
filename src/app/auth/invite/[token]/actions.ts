'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function acceptInviteAction(token: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/auth/invite/${token}`)
  }

  // Fetch invitation by token
  const { data: invitation } = await supabase
    .from('organization_invitations')
    .select('*')
    .eq('invite_token', token)
    .maybeSingle()

  if (!invitation) {
    return { error: '招待が見つかりません。' }
  }

  // Validate: not expired
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: 'この招待は有効期限が切れています。' }
  }

  // Validate: not already accepted
  if (invitation.accepted_at) {
    return { error: 'この招待はすでに承認済みです。' }
  }

  // Validate: email matches current user
  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    return { error: 'この招待はあなたのメールアドレス宛ではありません。' }
  }

  // Check if already a member of this org
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('org_id', invitation.org_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    // Already a member — just mark accepted and redirect
    await supabase
      .from('organization_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)
    redirect('/dashboard')
  }

  // Insert into organization_members
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      org_id: invitation.org_id,
      user_id: user.id,
      role: invitation.role,
    })

  if (memberError) {
    return { error: 'メンバーへの追加に失敗しました。' }
  }

  // Update invitation: accepted_at = now()
  await supabase
    .from('organization_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  // Update user's profile role if profile has no role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.role) {
    await supabase
      .from('profiles')
      .update({ role: invitation.role })
      .eq('id', user.id)
  }

  redirect('/dashboard')
}
