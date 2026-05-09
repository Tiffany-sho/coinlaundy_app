'use client'

import { useState, useTransition } from 'react'
import { Plus, Wrench } from 'lucide-react'
import { addMachineAction } from '@/app/dashboard/stores/[id]/machines/actions'

interface AddMachineFormProps {
  laundryId: string
}

export default function AddMachineForm({ laundryId }: AddMachineFormProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addMachineAction(laundryId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
      >
        <Plus className="h-4 w-4" />
        機器を追加
      </button>
    )
  }

  return (
    <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-800">新しい機器を追加</h3>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="machine-name" className="block text-xs font-medium text-gray-600 mb-1">
            機器名 <span className="text-red-500">*</span>
          </label>
          <input
            id="machine-name"
            name="name"
            type="text"
            required
            placeholder="例: 洗濯機、乾燥機"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
        </div>

        <div>
          <label htmlFor="unit-count" className="block text-xs font-medium text-gray-600 mb-1">
            台数
          </label>
          <input
            id="unit-count"
            name="unit_count"
            type="number"
            min={1}
            defaultValue={1}
            className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {isPending ? '追加中...' : '追加する'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setError(null)
            }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}
