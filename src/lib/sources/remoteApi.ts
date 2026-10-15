import type { LibraryPayload, MediaItem, MediaSource } from './types'

/**
 * Jalur kedua: server online.

 * Kontraknya identik dengan server lokal:
 *   GET <BASE>/api/library -> { items: MediaItem[] }
 *
 * Selama balikannya sama, UI dan player tidak perlu diubah sama sekali.
 * Isi VITE_REMOTE_API untuk mengaktifkan. Kosong = jalur ini dilewati.
 */
const BASE = (import.meta.env.VITE_REMOTE_API as string | undefined)?.replace(/\/+$/, '') || ''

async function list(): Promise<MediaItem[]> {
  if (!BASE) throw new Error('VITE_REMOTE_API belum diisi')

  const res = await fetch(`${BASE}/api/library`, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`library HTTP ${res.status}`)

  const data = (await res.json()) as LibraryPayload
  if (!data || !Array.isArray(data.items)) throw new Error('bentuk balikan tidak dikenal')

  return data.items.filter(
    (it): it is MediaItem =>
      !!it && typeof it.id === 'string' && typeof it.streamUrl === 'string',
  )
}

export const remoteSource: MediaSource = {
  id: 'remote',
  label: 'Server online',
  configured: () => BASE !== '',
  list,
}
