'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteStoreAction } from '@/app/dashboard/stores/actions'

interface DeleteStoreButtonProps {
  storeId: string
  storeName: string
}

export default function DeleteStoreButton({ storeId, storeName }: DeleteStoreButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`「${storeName}」を削除しますか？この操作は取り消せません。`)) return
    startTransition(async () => { await deleteStoreAction(storeId) })
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-accent-tomato bg-canvas border border-hairline-strong hover:bg-[#fff3f0] disabled:opacity-50 rounded-sm transition"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      削除
    </button>
  )
}
