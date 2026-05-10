import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, LogIn } from 'lucide-react'
import { acceptInviteAction } from './actions'

interface Props {
  params: Promise<{ token: string }>
}

type Role = 'admin' | 'collecter' | 'viewer'

const roleLabels: Record<Role, string> = {
  admin: '管理者',
  collecter: '集金担当',
  viewer: '閲覧者',
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch invitation
  const { data: invitation } = await supabase
    .from('organization_invitations')
    .select('id, email, role, expires_at, accepted_at, org_id')
    .eq('invite_token', token)
    .maybeSingle()

  // Fetch org name if invitation found
  let orgName: string | null = null
  if (invitation?.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invitation.org_id)
      .single()
    orgName = org?.name ?? null
  }

  // ─── Error states ───────────────────────────────────────────────────────

  if (!invitation) {
    return (
      <InviteLayout>
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-accent-tomato mb-4" />
          <h1 className="text-xl font-medium text-ink mb-2">招待が見つかりません</h1>
          <p className="text-sm text-ink-mute mb-6">
            この招待リンクは無効です。リンクが正しいか確認してください。
          </p>
          <Link href="/auth/login" className="btn-primary">
            ログインページへ
          </Link>
        </div>
      </InviteLayout>
    )
  }

  if (invitation.accepted_at) {
    return (
      <InviteLayout>
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-xl font-medium text-ink mb-2">この招待はすでに承認済みです</h1>
          <p className="text-sm text-ink-mute mb-6">
            すでにメンバーとして登録されています。
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-deep text-on-primary font-medium py-2.5 px-6 rounded-sm transition text-sm"
          >
            ダッシュボードへ
          </Link>
        </div>
      </InviteLayout>
    )
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <InviteLayout>
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 text-ink-mute mb-4" />
          <h1 className="text-xl font-medium text-ink mb-2">招待の有効期限が切れています</h1>
          <p className="text-sm text-ink-mute mb-6">
            この招待リンクは有効期限が切れています。組織の管理者に新しい招待を依頼してください。
          </p>
        </div>
      </InviteLayout>
    )
  }

  const role = invitation.role as Role

  // ─── Not logged in ──────────────────────────────────────────────────────

  if (!user) {
    return (
      <InviteLayout>
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto h-14 w-14 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-4">
              <LogIn className="h-7 w-7 text-ink-mute" />
            </div>
            <h1 className="text-xl font-medium text-ink mb-1">招待が届いています</h1>
            {orgName && (
              <p className="text-sm font-medium text-ink-mute">{orgName}</p>
            )}
          </div>

          <div className="bg-canvas-soft border border-hairline rounded-xl p-4 mb-6 text-left">
            <div className="text-sm text-ink-mute space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-mute">招待先メール</span>
                <span className="font-medium text-ink">{invitation.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">役割</span>
                <span className="font-medium text-ink">{roleLabels[role]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">有効期限</span>
                <span className="font-medium text-ink">
                  {new Date(invitation.expires_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-ink-mute mb-5">
            招待を承認するには、{invitation.email} でログインまたはアカウントを作成してください。
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/auth/login?next=/auth/invite/${token}&email=${encodeURIComponent(invitation.email)}`}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-deep text-on-primary font-medium py-2.5 px-6 rounded-sm transition text-sm"
            >
              ログインして承認する
            </Link>
            <Link
              href={`/auth/register?next=/auth/invite/${token}&email=${encodeURIComponent(invitation.email)}`}
              className="inline-flex items-center justify-center gap-2 bg-canvas border border-hairline-strong hover:bg-canvas-soft text-ink font-medium py-2.5 px-6 rounded-sm transition text-sm"
            >
              アカウントを作成して承認する
            </Link>
          </div>
        </div>
      </InviteLayout>
    )
  }

  // ─── Logged in — show confirmation ────────────────────────────────────

  const emailMismatch = invitation.email.toLowerCase() !== user.email?.toLowerCase()

  return (
    <InviteLayout>
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto h-14 w-14 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-4">
            <CheckCircle className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-medium text-ink mb-1">この招待を承認しますか？</h1>
          {orgName && (
            <p className="text-sm font-medium text-ink-mute">{orgName}</p>
          )}
        </div>

        {emailMismatch && (
          <div className="mb-5 rounded-lg bg-[#fff3f0] border border-accent-tomato/30 px-4 py-3 text-sm text-accent-tomato text-left">
            <strong>注意：</strong> この招待は <strong>{invitation.email}</strong> 宛ですが、
            現在 <strong>{user.email}</strong> でログインしています。
            承認しようとすると失敗します。
          </div>
        )}

        <div className="bg-canvas-soft border border-hairline rounded-xl p-4 mb-6 text-left">
          <div className="text-sm text-ink-mute space-y-1">
            {orgName && (
              <div className="flex justify-between">
                <span className="text-ink-mute">組織</span>
                <span className="font-medium text-ink">{orgName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-mute">役割</span>
              <span className="font-medium text-ink">{roleLabels[role]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-mute">有効期限</span>
              <span className="font-medium text-ink">
                {new Date(invitation.expires_at).toLocaleDateString('ja-JP')}
              </span>
            </div>
          </div>
        </div>

        <form
          action={async () => {
            'use server'
            await acceptInviteAction(token)
          }}
        >
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-deep text-on-primary font-medium py-2.5 px-6 rounded-sm transition text-sm"
          >
            招待を承認する
          </button>
        </form>

        <p className="mt-4 text-xs text-ink-mute">
          現在 {user.email} でログイン中
        </p>
      </div>
    </InviteLayout>
  )
}

function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-canvas border border-hairline rounded-xl shadow-sm p-8">
        <div className="mb-6 text-center">
          <span className="text-2xl font-medium text-ink tracking-tight">Collecie</span>
          <p className="text-xs text-ink-faint mt-0.5">コインランドリー集金管理</p>
        </div>
        {children}
      </div>
    </div>
  )
}
