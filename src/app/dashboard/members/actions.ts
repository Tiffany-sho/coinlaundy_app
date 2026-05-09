'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ─── Invite Member ──────────────────────────────────────────────────────────

export async function inviteMemberAction(formData: FormData) {
  const { user, profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    return { error: '管理者権限が必要です。' }
  }

  if (!membership?.org_id) {
    return { error: '組織が見つかりません。' }
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role = formData.get('role') as 'admin' | 'collecter' | 'viewer'

  if (!email) {
    return { error: 'メールアドレスを入力してください。' }
  }

  if (!['admin', 'collecter', 'viewer'].includes(role)) {
    return { error: '役割が正しくありません。' }
  }

  const supabase = await createClient()

  // Check if already a member (by email via auth.users - we check profiles instead)
  // Check for existing pending invitation
  const { data: existingInvite } = await supabase
    .from('organization_invitations')
    .select('id')
    .eq('org_id', membership.org_id)
    .eq('email', email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existingInvite) {
    return { error: 'このメールアドレスへの招待はすでに保留中です。' }
  }

  const inviteToken = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error: insertError } = await supabase
    .from('organization_invitations')
    .insert({
      org_id: membership.org_id,
      email,
      invite_token: inviteToken,
      role,
      inviter_id: user.id,
      expires_at: expiresAt.toISOString(),
    })

  if (insertError) {
    return { error: '招待の作成に失敗しました。' }
  }

  revalidatePath('/dashboard/members')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const inviteLink = `${siteUrl}/auth/invite/${inviteToken}`

  return { success: true, inviteLink }
}

// ─── Cancel Invite ──────────────────────────────────────────────────────────

export async function cancelInviteAction(inviteId: string) {
  const { profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    return { error: '管理者権限が必要です。' }
  }

  if (!membership?.org_id) {
    return { error: '組織が見つかりません。' }
  }

  const supabase = await createClient()

  // Verify invitation belongs to user's org
  const { data: invite } = await supabase
    .from('organization_invitations')
    .select('id')
    .eq('id', inviteId)
    .eq('org_id', membership.org_id)
    .maybeSingle()

  if (!invite) {
    return { error: '招待が見つかりません。' }
  }

  const { error } = await supabase
    .from('organization_invitations')
    .delete()
    .eq('id', inviteId)

  if (error) {
    return { error: '招待のキャンセルに失敗しました。' }
  }

  revalidatePath('/dashboard/members')
  return { success: true }
}

// ─── Update Member Role ─────────────────────────────────────────────────────

export async function updateMemberRoleAction(memberId: string, newRole: string) {
  const { user, profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    return { error: '管理者権限が必要です。' }
  }

  if (!membership?.org_id) {
    return { error: '組織が見つかりません。' }
  }

  if (!['admin', 'collecter', 'viewer'].includes(newRole)) {
    return { error: '役割が正しくありません。' }
  }

  const supabase = await createClient()

  // Get the member record
  const { data: member } = await supabase
    .from('organization_members')
    .select('id, user_id')
    .eq('id', memberId)
    .eq('org_id', membership.org_id)
    .maybeSingle()

  if (!member) {
    return { error: 'メンバーが見つかりません。' }
  }

  // Cannot change own role
  if (member.user_id === user.id) {
    return { error: '自分の役割は変更できません。' }
  }

  const { error: memberError } = await supabase
    .from('organization_members')
    .update({ role: newRole as 'admin' | 'collecter' | 'viewer' })
    .eq('id', memberId)

  if (memberError) {
    return { error: '役割の更新に失敗しました。' }
  }

  // Update profiles.role for that user
  await supabase
    .from('profiles')
    .update({ role: newRole as 'admin' | 'collecter' | 'viewer' })
    .eq('id', member.user_id)

  revalidatePath('/dashboard/members')
  return { success: true }
}

// ─── Remove Member ──────────────────────────────────────────────────────────

export async function removeMemberAction(memberId: string) {
  const { user, profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    return { error: '管理者権限が必要です。' }
  }

  if (!membership?.org_id) {
    return { error: '組織が見つかりません。' }
  }

  const supabase = await createClient()

  // Get the member record
  const { data: member } = await supabase
    .from('organization_members')
    .select('id, user_id')
    .eq('id', memberId)
    .eq('org_id', membership.org_id)
    .maybeSingle()

  if (!member) {
    return { error: 'メンバーが見つかりません。' }
  }

  // Cannot remove yourself
  if (member.user_id === user.id) {
    return { error: '自分自身を削除することはできません。' }
  }

  // Cannot remove org owner
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', membership.org_id)
    .single()

  if (org?.owner_id === member.user_id) {
    return { error: 'オーナーを削除することはできません。' }
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    return { error: 'メンバーの削除に失敗しました。' }
  }

  revalidatePath('/dashboard/members')
  return { success: true }
}
