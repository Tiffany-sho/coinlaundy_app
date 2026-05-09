import { Clock } from 'lucide-react'
import type { ActionMessage } from '@/types/database'

interface ActionMessageWithActor extends ActionMessage {
  profiles: { full_name: string | null; username: string | null } | null
}

interface Props {
  actions: ActionMessageWithActor[]
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  const rtf = new Intl.RelativeTimeFormat('ja', { numeric: 'auto' })

  if (diffSec < 60) return rtf.format(-diffSec, 'second')
  if (diffMin < 60) return rtf.format(-diffMin, 'minute')
  if (diffHour < 24) return rtf.format(-diffHour, 'hour')
  if (diffDay < 30) return rtf.format(-diffDay, 'day')

  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return rtf.format(-diffMonth, 'month')

  return rtf.format(-Math.floor(diffMonth / 12), 'year')
}

export default function ActionLog({ actions }: Props) {
  if (actions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Clock className="mx-auto h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">アクションログがありません</p>
      </div>
    )
  }

  return (
    <ol className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" aria-hidden="true" />

      {actions.map((action, index) => {
        const actorName =
          action.profiles?.full_name ??
          action.profiles?.username ??
          '不明なユーザー'

        const relativeTime = formatRelativeTime(action.occurred_at)
        const absoluteTime = new Intl.DateTimeFormat('ja-JP', {
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(action.occurred_at))

        return (
          <li
            key={action.id}
            className={`relative flex gap-4 ${index !== actions.length - 1 ? 'pb-6' : ''}`}
          >
            {/* Timeline dot */}
            <div className="flex-shrink-0 z-10 flex items-center justify-center h-10 w-10 rounded-full bg-white border-2 border-indigo-200 shadow-sm">
              <Clock className="h-4 w-4 text-indigo-500" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-gray-800">{actorName}</span>
                <span className="text-sm text-gray-700">{action.message}</span>
              </div>
              <time
                dateTime={action.occurred_at}
                title={absoluteTime}
                className="mt-0.5 block text-xs text-gray-400"
              >
                {relativeTime}
                <span className="ml-2 text-gray-300">({absoluteTime})</span>
              </time>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
