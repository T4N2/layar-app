import type { LibraryPayload, MediaItem, MediaSource } from './types'

/**
 * Base URL API media.
 * Default '/media' -> diteruskan proxy Vite ke server/media-server.mjs.
 * Isi VITE_MEDIA_API kalau frontend dan server beda origin.
 */
const BASE = (import.meta.env.VITE_MEDIA_API as string | undefined)?.replace(/\/+$/, '') || '/media'

async function list(): Promise<MediaItem[]> {
  const res = await fetch(`${BASE}/api/library`, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`library HTTP ${res.status}`)

  const data = (await res.json()) as LibraryPayload
  if (!data || !Array.isArray(data.items)) throw new Error('bentuk balikan tidak dikenal')

  return data.items.filter(
    (it): it is MediaItem =>
      !!it && typeof it.id === 'string' && typeof it.streamUrl === 'string',
  )
}

export const localSource: MediaSource = {
  id: 'local',
  label: 'Folder lokal',
  configured: () => true,
  list,
}
