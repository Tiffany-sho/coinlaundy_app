'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Store, MapPin, FileText, ImagePlus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createStoreAction, updateStoreAction } from '@/app/dashboard/stores/actions'
import type { LaundryStore } from '@/types/database'

interface StoreFormProps {
  mode: 'create' | 'edit'
  store?: LaundryStore
}

export default function StoreForm({ mode, store }: StoreFormProps) {
  const router = useRouter()
  const [name, setName] = useState(store?.name ?? '')
  const [location, setLocation] = useState(store?.location ?? '')
  const [description, setDescription] = useState(store?.description ?? '')
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (!store?.images) return []
    if (Array.isArray(store.images)) return store.images as string[]
    return []
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error: uploadError } = await supabase.storage
        .from('laundry-images')
        .upload(`laundry/${filename}`, file)
      if (uploadError) { setError('画像のアップロードに失敗しました。'); return }
      const { data: publicData } = supabase.storage.from('laundry-images').getPublicUrl(data.path)
      setImageUrls((prev) => [...prev, publicData.publicUrl])
    } catch {
      setError('画像のアップロードに失敗しました。')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('店舗名を入力してください。'); return }
    if (!location.trim()) { setError('所在地を入力してください。'); return }

    const formData = new FormData()
    formData.set('name', name)
    formData.set('location', location)
    formData.set('description', description)
    formData.set('images', JSON.stringify(imageUrls))

    startTransition(async () => {
      let result: { error: string } | undefined
      if (mode === 'create') result = await createStoreAction(formData) as { error: string } | undefined
      else if (mode === 'edit' && store) result = await updateStoreAction(store.id, formData) as { error: string } | undefined
      if (result?.error) setError(result.error)
    })
  }

  const inputClass = "w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition"

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-[#fff3f0] border border-accent-tomato/30 px-4 py-3 text-sm text-accent-tomato">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink-mute mb-1">
          店舗名 <span className="text-accent-tomato">*</span>
        </label>
        <div className="relative">
          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: コインランドリー渋谷店"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-ink-mute mb-1">
          所在地 <span className="text-accent-tomato">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <input
            id="location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例: 東京都渋谷区渋谷1-2-3"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink-mute mb-1">
          備考 <span className="text-ink-faint text-xs">(任意)</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-ink-faint" />
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="店舗に関するメモや特記事項など"
            rows={3}
            className="w-full pl-10 pr-4 py-2.5 border border-hairline rounded-sm text-sm focus:outline-none focus:border-ink-mute-2 transition resize-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-mute mb-2">
          店舗画像 <span className="text-ink-faint text-xs">(任意)</span>
        </label>

        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden border border-hairline group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`店舗画像 ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/60 text-on-dark rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 border border-dashed border-hairline-strong rounded-sm hover:border-primary hover:bg-canvas-soft transition text-sm text-ink-mute">
          {uploadingImage ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-4 w-4 text-ink-faint" />
          )}
          {uploadingImage ? 'アップロード中...' : '画像を追加'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploadingImage}
            className="hidden"
          />
        </label>
        <p className="mt-1 text-xs text-ink-faint">PNG, JPG, WEBP など対応</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-ink bg-canvas border border-hairline-strong hover:bg-canvas-soft rounded-sm transition"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isPending || uploadingImage}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-deep disabled:opacity-50 disabled:cursor-not-allowed text-on-primary text-sm font-medium rounded-sm transition"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'create' ? '店舗を登録する' : '変更を保存する'}
        </button>
      </div>
    </form>
  )
}
