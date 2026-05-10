'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '削除する',
  isPending = false,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) {
      if (!el.open) el.showModal()
    } else {
      if (el.open) el.close()
    }
  }, [open])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (
      rect &&
      (e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom)
    ) {
      onCancel()
    }
  }

  return (
    <dialog
      ref={ref}
      onCancel={onCancel}
      onClick={handleBackdropClick}
      className="rounded-lg border border-hairline shadow-lg p-0 w-full max-w-sm"
    >
      <div className="p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#ffece8] flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-accent-tomato" />
          </div>
          <div className="pt-1 min-w-0">
            <h3 className="text-base font-medium text-ink">{title}</h3>
            <p className="text-sm text-ink-mute mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-ink bg-canvas border border-hairline hover:bg-canvas-soft rounded-sm transition disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-tomato hover:opacity-90 rounded-sm transition disabled:opacity-50"
          >
            {isPending ? '削除中...' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
