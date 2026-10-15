import type { MediaItem, MediaSource } from './types'
import { localSource } from './localApi'
import { remoteSource } from './remoteApi'

export type { MediaItem, MediaSource } from './types'

/** Urutan percobaan. Yang pertama berhasil dan tidak kosong, itu yang dipakai. */
const SOURCES: MediaSource[] = [localSource, remoteSource]

export interface LoadedLibrary {
  source: MediaSource
  items: MediaItem[]
}

/**
 * Coba setiap sumber yang sudah dikonfigurasi.
 * Balikkan null kalau tidak ada yang tersedia -> frontend pakai katalog demo.
 */
export async function loadLibrary(): Promise<LoadedLibrary | null> {
  for (const source of SOURCES) {
    if (!source.configured()) continue
    try {
      const items = await source.list()
      if (items.length > 0) return { source, items }
    } catch {
      /* sumber ini mati — lanjut ke berikutnya */
    }
  }
  return null
}
