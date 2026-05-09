'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithOrg } from '@/lib/auth'

export async function addInventoryTypeAction(formData: FormData) {
  const { user, profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    return { error: '管理者のみ在庫種別を追加できます。' }
  }

  if (!membership?.org_id) {
    return { error: '組織が見つかりません。' }
  }

  const name = (formData.get('name') as string)?.trim()
  const unit = (formData.get('unit') as string)?.trim() || null
  const alertThresholdRaw = formData.get('alert_threshold') as string
  const alertThreshold = alertThresholdRaw ? parseInt(alertThresholdRaw, 10) : 2

  if (!name) {
    return { error: '在庫種別名を入力してください。' }
  }

  const supabase = await createClient()

  const { data: inventoryType, error: insertError } = await supabase
    .from('inventory_types')
    .insert({ org_id: membership.org_id, name, unit, alert_threshold: alertThreshold })
    .select('id')
    .single()

  if (insertError || !inventoryType) {
    return { error: '在庫種別の追加に失敗しました。' }
  }

  const { data: stores } = await supabase
    .from('laundry_store')
    .select('id')
    .eq('organization_id', membership.org_id)

  if (stores && stores.length > 0) {
    const inventoryRows = stores.map((store) => ({
      laundry_id: store.id,
      inventory_type_id: inventoryType.id,
      quantity: 0,
      updated_by: user.id,
    }))
    await supabase.from('laundry_inventory').insert(inventoryRows)
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

export async function updateInventoryTypeAction(
  typeId: string,
  data: { name: string; unit: string; alert_threshold: number }
) {
  const { profile } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    return { error: '管理者のみ在庫種別を編集できます。' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory_types')
    .update({
      name: data.name.trim(),
      unit: data.unit.trim() || null,
      alert_threshold: data.alert_threshold,
    })
    .eq('id', typeId)

  if (error) {
    return { error: '在庫種別の更新に失敗しました。' }
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

export async function deleteInventoryTypeAction(typeId: string) {
  const { profile } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    return { error: '管理者のみ在庫種別を削除できます。' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory_types')
    .delete()
    .eq('id', typeId)

  if (error) {
    return { error: '在庫種別の削除に失敗しました。' }
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

export async function updateInventoryAction(inventoryId: string, quantity: number) {
  const { user, profile } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin' && profile.role !== 'collecter') {
    return { error: '在庫の更新権限がありません。' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('laundry_inventory')
    .update({ quantity, updated_by: user.id })
    .eq('id', inventoryId)

  if (error) {
    return { error: '在庫の更新に失敗しました。' }
  }

  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard/stores', 'layout')
  return { success: true }
}

export async function bulkUpdateInventoryAction(
  updates: { inventoryId: string; quantity: number }[]
) {
  const { user, profile } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin' && profile.role !== 'collecter') {
    return { error: '在庫の更新権限がありません。' }
  }

  if (updates.length === 0) return { success: true }

  const supabase = await createClient()

  const results = await Promise.all(
    updates.map(({ inventoryId, quantity }) =>
      supabase
        .from('laundry_inventory')
        .update({ quantity, updated_by: user.id })
        .eq('id', inventoryId)
    )
  )

  const hasError = results.some((r) => r.error)
  if (hasError) {
    return { error: '一部の在庫の更新に失敗しました。' }
  }

  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard/stores', 'layout')
  return { success: true }
}
