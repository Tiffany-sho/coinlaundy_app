'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithOrg } from '@/lib/auth'
import type { FundsItem } from '@/types/database'

export async function createCollectionAction(formData: FormData) {
  const { user, profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin' && profile.role !== 'collecter') {
    return { error: '集金記録を作成する権限がありません。' }
  }

  if (!membership?.org_id) {
    return { error: '組織が見つかりません。' }
  }

  const laundry_id = formData.get('laundry_id') as string
  const collected_at = formData.get('collected_at') as string
  const funds_array_raw = formData.get('funds_array') as string

  if (!laundry_id || !collected_at || !funds_array_raw) {
    return { error: '必須項目を入力してください。' }
  }

  let funds_array: FundsItem[]
  try {
    funds_array = JSON.parse(funds_array_raw)
  } catch {
    return { error: '集金データの形式が不正です。' }
  }

  const total_funds = funds_array.reduce((sum, item) => sum + item.amount, 0)

  if (total_funds <= 0) {
    return { error: '集金額は1円以上を入力してください。' }
  }

  // Validate denomination sums when track_denominations is used
  for (const item of funds_array) {
    if (item.denominations) {
      const denominationTotal =
        (item.denominations['10'] ?? 0) * 10 +
        (item.denominations['50'] ?? 0) * 50 +
        (item.denominations['100'] ?? 0) * 100 +
        (item.denominations['500'] ?? 0) * 500 +
        (item.denominations['1000'] ?? 0) * 1000
      if (denominationTotal !== item.amount) {
        return {
          error: `「${item.name}」の金種合計（¥${denominationTotal.toLocaleString('ja-JP')}）が入力金額（¥${item.amount.toLocaleString('ja-JP')}）と一致しません。`,
        }
      }
    }
  }

  const supabase = await createClient()

  const { data: record, error: insertError } = await supabase
    .from('collect_funds')
    .insert({
      laundry_id,
      collected_at,
      total_funds,
      funds_array: funds_array as unknown as import('@/types/database').Json,
      collector_id: user.id,
    })
    .select('id')
    .single()

  if (insertError || !record) {
    return { error: '集金記録の保存に失敗しました。' }
  }

  // Log to action_message
  await supabase.from('action_message').insert({
    org_id: membership.org_id,
    actor_id: user.id,
    message: `集金を記録しました（¥${total_funds.toLocaleString('ja-JP')}）`,
  })

  revalidatePath('/dashboard/collect')
  revalidatePath(`/dashboard/stores/${laundry_id}/collect`)
  redirect(`/dashboard/collect/${record.id}`)
}

export async function updateCollectionAction(recordId: string, formData: FormData) {
  const { user, profile } = await getCurrentUserWithOrg()

  const supabase = await createClient()

  // Fetch existing record
  const { data: existing } = await supabase
    .from('collect_funds')
    .select('*')
    .eq('id', recordId)
    .single()

  if (!existing) {
    return { error: '集金記録が見つかりません。' }
  }

  // Permission check
  if (profile.role === 'collecter' && existing.collector_id !== user.id) {
    return { error: 'この記録を編集する権限がありません。' }
  }

  if (profile.role !== 'admin' && profile.role !== 'collecter') {
    return { error: '集金記録を編集する権限がありません。' }
  }

  const laundry_id = formData.get('laundry_id') as string
  const collected_at = formData.get('collected_at') as string
  const funds_array_raw = formData.get('funds_array') as string

  if (!laundry_id || !collected_at || !funds_array_raw) {
    return { error: '必須項目を入力してください。' }
  }

  let funds_array: FundsItem[]
  try {
    funds_array = JSON.parse(funds_array_raw)
  } catch {
    return { error: '集金データの形式が不正です。' }
  }

  const total_funds = funds_array.reduce((sum, item) => sum + item.amount, 0)

  if (total_funds <= 0) {
    return { error: '集金額は1円以上を入力してください。' }
  }

  // Validate denomination sums when track_denominations is used
  for (const item of funds_array) {
    if (item.denominations) {
      const denominationTotal =
        (item.denominations['10'] ?? 0) * 10 +
        (item.denominations['50'] ?? 0) * 50 +
        (item.denominations['100'] ?? 0) * 100 +
        (item.denominations['500'] ?? 0) * 500 +
        (item.denominations['1000'] ?? 0) * 1000
      if (denominationTotal !== item.amount) {
        return {
          error: `「${item.name}」の金種合計（¥${denominationTotal.toLocaleString('ja-JP')}）が入力金額（¥${item.amount.toLocaleString('ja-JP')}）と一致しません。`,
        }
      }
    }
  }

  const { error: updateError } = await supabase
    .from('collect_funds')
    .update({
      laundry_id,
      collected_at,
      total_funds,
      funds_array: funds_array as unknown as import('@/types/database').Json,
    })
    .eq('id', recordId)

  if (updateError) {
    return { error: '集金記録の更新に失敗しました。' }
  }

  revalidatePath('/dashboard/collect')
  revalidatePath(`/dashboard/collect/${recordId}`)
  revalidatePath(`/dashboard/stores/${laundry_id}/collect`)
  redirect(`/dashboard/collect/${recordId}`)
}

export async function deleteCollectionAction(recordId: string) {
  const { user, profile } = await getCurrentUserWithOrg()

  const supabase = await createClient()

  // Fetch existing record
  const { data: existing } = await supabase
    .from('collect_funds')
    .select('*')
    .eq('id', recordId)
    .single()

  if (!existing) {
    return { error: '集金記録が見つかりません。' }
  }

  // Permission check
  if (profile.role === 'collecter' && existing.collector_id !== user.id) {
    return { error: 'この記録を削除する権限がありません。' }
  }

  if (profile.role !== 'admin' && profile.role !== 'collecter') {
    return { error: '集金記録を削除する権限がありません。' }
  }

  const { error: deleteError } = await supabase
    .from('collect_funds')
    .delete()
    .eq('id', recordId)

  if (deleteError) {
    return { error: '集金記録の削除に失敗しました。' }
  }

  revalidatePath('/dashboard/collect')
  revalidatePath(`/dashboard/stores/${existing.laundry_id}/collect`)
  redirect('/dashboard/collect')
}
