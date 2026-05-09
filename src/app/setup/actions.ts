'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function setupProfileAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/auth/login')
  }

  const fullName = formData.get('full_name') as string
  const username = (formData.get('username') as string) || null
  const role = formData.get('role') as 'admin' | 'collecter' | 'viewer'

  if (!fullName || !role) {
    return { error: '必須項目を入力してください。' }
  }

  // Role-specific fields (admin only)
  const collectMethod = role === 'admin'
    ? (formData.get('collect_method') as 'machines' | 'total') || null
    : null
  const trackDenominations = role === 'admin'
    ? formData.get('track_denominations') === 'true'
    : false
  const collectionCycle = role === 'admin'
    ? (formData.get('collection_cycle') as 'weekly' | 'monthly') || null
    : null

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      username,
      role,
      collect_method: collectMethod,
      track_denominations: trackDenominations,
      collection_cycle: collectionCycle,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: 'プロフィールの更新に失敗しました。' }
  }

  if (role === 'admin') {
    const orgName = formData.get('org_name') as string
    if (!orgName) {
      return { error: '組織名を入力してください。' }
    }

    // Insert organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName, owner_id: user.id })
      .select('id')
      .single()

    if (orgError || !org) {
      return { error: '組織の作成に失敗しました。' }
    }

    // Insert organization member
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({ org_id: org.id, user_id: user.id, role: 'admin' })

    if (memberError) {
      return { error: 'メンバー登録に失敗しました。' }
    }
  }

  redirect('/dashboard')
}
