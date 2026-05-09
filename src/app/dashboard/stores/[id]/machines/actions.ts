'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithOrg } from '@/lib/auth'

export async function addMachineAction(laundryId: string, formData: FormData) {
  const { user, profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    return { error: '管理者権限が必要です。' }
  }

  const name = (formData.get('name') as string)?.trim()
  const unitCount = parseInt(formData.get('unit_count') as string, 10) || 1

  if (!name) {
    return { error: '機器名を入力してください。' }
  }

  if (unitCount < 1) {
    return { error: '台数は1以上を入力してください。' }
  }

  const supabase = await createClient()

  // Get max sort_order for this store's machines
  const { data: maxRow } = await supabase
    .from('machines')
    .select('sort_order')
    .eq('laundry_id', laundryId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxRow?.sort_order ?? 0) + 1

  const { error } = await supabase.from('machines').insert({
    laundry_id: laundryId,
    name,
    unit_count: unitCount,
    is_broken: false,
    sort_order: nextSortOrder,
    updated_by: user.id,
  })

  if (error) {
    return { error: '機器の追加に失敗しました。' }
  }

  revalidatePath(`/dashboard/stores/${laundryId}/machines`)
  revalidatePath(`/dashboard/stores/${laundryId}`)
  return { success: true }
}

export async function updateMachineStatusAction(
  machineId: string,
  is_broken: boolean,
  comment: string
) {
  const { user, profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin' && profile.role !== 'collecter') {
    return { error: '権限がありません。' }
  }

  const supabase = await createClient()

  // Fetch machine to get name and laundry_id
  const { data: machine } = await supabase
    .from('machines')
    .select('id, name, laundry_id')
    .eq('id', machineId)
    .single()

  if (!machine) {
    return { error: '機器が見つかりません。' }
  }

  const { error: updateError } = await supabase
    .from('machines')
    .update({
      is_broken,
      comment: comment || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', machineId)

  if (updateError) {
    return { error: '状態の更新に失敗しました。' }
  }

  // Log to action_message
  if (membership?.org_id) {
    const actorName = profile.full_name || profile.username || 'ユーザー'
    await supabase.from('action_message').insert({
      org_id: membership.org_id,
      actor_id: user.id,
      message: `${actorName}が${machine.name}の状態を更新しました (${is_broken ? '故障中' : '正常'})`,
    })
  }

  revalidatePath(`/dashboard/stores/${machine.laundry_id}/machines`)
  revalidatePath(`/dashboard/stores/${machine.laundry_id}`)
  return { success: true }
}

export async function deleteMachineAction(machineId: string) {
  const { profile } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    return { error: '管理者権限が必要です。' }
  }

  const supabase = await createClient()

  // Fetch machine to get laundry_id for revalidation
  const { data: machine } = await supabase
    .from('machines')
    .select('id, laundry_id')
    .eq('id', machineId)
    .single()

  if (!machine) {
    return { error: '機器が見つかりません。' }
  }

  const { error } = await supabase.from('machines').delete().eq('id', machineId)

  if (error) {
    return { error: '機器の削除に失敗しました。' }
  }

  revalidatePath(`/dashboard/stores/${machine.laundry_id}/machines`)
  revalidatePath(`/dashboard/stores/${machine.laundry_id}`)
  return { success: true }
}
