'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteCollectionAction } from '@/app/dashboard/collect/actions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Props {
  id: string
}

export default function DeleteCollectionButton({ id }: Props) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    setOpen(false)
    startTransition(async () => { await deleteCollectionAction(id) })
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-accent-tomato bg-canvas border border-hairline-strong hover:bg-[#fff3f0] rounded-sm transition"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        削除
      </button>
      <ConfirmDialog
        open={open}
        title="集金記録を削除"
        message="この操作は取り消せません。"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        isPending={isPending}
      />
    </>
  )
}
