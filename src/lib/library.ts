import type { Title } from '../types'
import type { MediaItem } from './sources/types'
import { paletteFor } from './art'
import { formatBytes } from './format'

/** Nama file -> judul yang enak dibaca. */
export function cleanName(name: string): string {
  return name
    .replace(/\.[a-z0-9]{2,4}$/i, '')
    .replace(/[._]+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** MediaItem (dari API) -> Title (yang dipakai UI). */
export function mediaToTitle(item: MediaItem): Title {
  const when = new Date(item.modified)
  const year = Number.isNaN(when.getTime()) ? new Date().getFullYear() : when.getFullYear()

  return {
    id: item.id,
    title: cleanName(item.title),
    year,
    type: 'film',
    genres: [item.folder || 'Lainnya'],
    synopsis: `${item.relPath} · ${formatBytes(item.sizeBytes)}`,
    cast: [],
    colors: paletteFor(item.id),
    tags: [],
    sourceLabel: item.folder || 'Lokal',
    media: {
      streamUrl: item.streamUrl,
      relPath: item.relPath,
      sizeBytes: item.sizeBytes,
    },
  }
}

export interface BuiltRow {
  key: string
  title: string
  items: Title[]
  showProgress?: boolean
}

/**
 * Susun baris beranda.
 * Katalog demo punya tag (trending/popular); pustaka lokal dikelompokkan per folder.
 */
export function buildRows(
  titles: Title[],
  isDemo: boolean,
  extras: { continuing: Title[]; mylist: Title[] },
): BuiltRow[] {
  const rows: BuiltRow[] = []

  if (extras.continuing.length > 0) {
    rows.push({ key: 'continue', title: 'Lanjutkan Tonton', items: extras.continuing, showProgress: true })
  }

  if (isDemo) {
    rows.push({
      key: 'trending',
      title: 'Trending Sekarang',
      items: titles.filter((t) => t.tags.includes('trending')),
    })
    rows.push({
      key: 'popular',
      title: 'Film Populer',
      items: titles.filter((t) => t.type === 'film' && t.tags.includes('popular')),
    })
    rows.push({
      key: 'series',
      title: 'Serial Terbaru',
      items: titles.filter((t) => t.type === 'series'),
    })
  } else {
    const byFolder = new Map<string, Title[]>()
    for (const t of titles) {
      const key = t.genres[0] ?? 'Lainnya'
      const bucket = byFolder.get(key)
      if (bucket) bucket.push(t)
      else byFolder.set(key, [t])
    }

    if (byFolder.size <= 1) {
      rows.push({ key: 'all', title: `Semua Video (${titles.length})`, items: titles })
    } else {
      for (const [folder, items] of byFolder) {
        rows.push({ key: `folder:${folder}`, title: `${folder} (${items.length})`, items })
      }
    }
  }

  if (extras.mylist.length > 0) {
    rows.push({ key: 'mylist', title: 'Daftar Saya', items: extras.mylist })
  }

  return rows
}
