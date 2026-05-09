import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Collecie - 認証',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-medium text-ink tracking-tight">Collecie</h1>
        <p className="mt-2 text-sm text-ink-mute">コインランドリー集金管理</p>
      </div>
      {children}
    </div>
  )
}
