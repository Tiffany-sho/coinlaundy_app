'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithOrg } from '@/lib/auth'

export async function createStoreAction(formData: FormData) {
  const { user, profile, membership } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    redirect('/dashboard/stores')
  }

  if (!membership?.org_id) {
    return { error: '組織が見つかりません。' }
  }

  const supabase = await createClient()

  const name = formData.get('name') as string
  const location = (formData.get('location') as string) || null
  const description = (formData.get('description') as string) || null
  const imagesRaw = formData.get('images') as string | null
  const images = imagesRaw ? JSON.parse(imagesRaw) : null

  if (!name) {
    return { error: '店舗名を入力してください。' }
  }

  // Insert store
  const { data: store, error: storeError } = await supabase
    .from('laundry_store')
    .insert({
      organization_id: membership.org_id,
      owner_id: user.id,
      name,
      location,
      description,
      images,
    })
    .select('id')
    .single()

  if (storeError || !store) {
    return { error: '店舗の登録に失敗しました。' }
  }

  // Fetch all inventory types for the org
  const { data: inventoryTypes } = await supabase
    .from('inventory_types')
    .select('id')
    .eq('org_id', membership.org_id)

  // Insert laundry_inventory rows for each inventory type with quantity=0
  if (inventoryTypes && inventoryTypes.length > 0) {
    const inventoryRows = inventoryTypes.map((it) => ({
      laundry_id: store.id,
      inventory_type_id: it.id,
      quantity: 0,
    }))

    await supabase.from('laundry_inventory').insert(inventoryRows)
  }

  revalidatePath('/dashboard/stores')
  redirect(`/dashboard/stores/${store.id}`)
}

export async function updateStoreAction(storeId: string, formData: FormData) {
  const { profile } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    redirect('/dashboard/stores')
  }

  const supabase = await createClient()

  const name = formData.get('name') as string
  const location = (formData.get('location') as string) || null
  const description = (formData.get('description') as string) || null
  const imagesRaw = formData.get('images') as string | null
  const images = imagesRaw ? JSON.parse(imagesRaw) : null

  if (!name) {
    return { error: '店舗名を入力してください。' }
  }

  const { error } = await supabase
    .from('laundry_store')
    .update({ name, location, description, images })
    .eq('id', storeId)

  if (error) {
    return { error: '店舗の更新に失敗しました。' }
  }

  revalidatePath('/dashboard/stores')
  revalidatePath(`/dashboard/stores/${storeId}`)
  redirect(`/dashboard/stores/${storeId}`)
}

export async function deleteStoreAction(storeId: string) {
  const { profile } = await getCurrentUserWithOrg()

  if (profile.role !== 'admin') {
    redirect('/dashboard/stores')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('laundry_store')
    .delete()
    .eq('id', storeId)

  if (error) {
    return { error: '店舗の削除に失敗しました。' }
  }

  revalidatePath('/dashboard/stores')
  redirect('/dashboard/stores')
}
