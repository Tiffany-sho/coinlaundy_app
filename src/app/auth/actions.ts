'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'メールアドレスとパスワードを入力してください。' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'メールアドレスまたはパスワードが正しくありません。' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'メールアドレスが確認されていません。確認メールをご確認ください。' }
    }
    return { error: 'ログインに失敗しました。もう一度お試しください。' }
  }

  redirect('/dashboard')
}

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const passwordConfirm = formData.get('passwordConfirm') as string

  if (!email || !password || !passwordConfirm) {
    return { error: 'すべての項目を入力してください。' }
  }

  if (password !== passwordConfirm) {
    return { error: 'パスワードが一致しません。' }
  }

  if (password.length < 6) {
    return { error: 'パスワードは6文字以上で入力してください。' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('User already registered')) {
      return { error: 'このメールアドレスはすでに登録されています。' }
    }
    return { error: 'アカウント作成に失敗しました。もう一度お試しください。' }
  }

  return { success: true }
}

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'メールアドレスを入力してください。' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    return { error: 'メールの送信に失敗しました。もう一度お試しください。' }
  }

  return { success: true }
}

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get('password') as string
  const passwordConfirm = formData.get('passwordConfirm') as string

  if (!password || !passwordConfirm) {
    return { error: 'すべての項目を入力してください。' }
  }

  if (password !== passwordConfirm) {
    return { error: 'パスワードが一致しません。' }
  }

  if (password.length < 6) {
    return { error: 'パスワードは6文字以上で入力してください。' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'パスワードの更新に失敗しました。もう一度お試しください。' }
  }

  redirect('/auth/login')
}
