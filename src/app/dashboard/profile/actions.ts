'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function updateProfileAction(formData: FormData) {
  const { user } = await getCurrentUserWithOrg()
  const supabase = await createClient()

  const full_name = formData.get('full_name') as string | null
  const username = formData.get('username') as string | null
  const phone_number = formData.get('phone_number') as string | null
  const notification_email = formData.get('notification_email') as string | null
  const collect_method = formData.get('collect_method') as 'machines' | 'total' | null
  const track_denominations = formData.get('track_denominations') === 'on'
  const collection_cycle = formData.get('collection_cycle') as 'weekly' | 'monthly' | null

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: full_name || null,
      username: username || null,
      phone_number: phone_number || null,
      notification_email: notification_email || null,
      collect_method: collect_method || null,
      track_denominations,
      collection_cycle: collection_cycle || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/profile')
  return { success: true }
}
