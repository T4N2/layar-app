export type MediaType = 'film' | 'series'

export type Tag = 'trending' | 'popular' | 'new'

/** File video yang benar-benar bisa diputar. */
export interface MediaBacking {
  /** URL yang dikirim ke elemen <video>. */
  streamUrl: string
  /** Path relatif di dalam folder media, untuk ditampilkan. */
  relPath: string
  sizeBytes: number
}

export interface Title {
  id: string
  title: string
  year: number
  type: MediaType
  genres: string[]
  synopsis: string
  cast: string[]
  /** Dua warna untuk gradien poster: [awal, akhir]. */
  colors: [string, string]
  tags: Tag[]

  /* --- hanya ada di katalog demo --- */
  rating?: number
  duration?: string
  seasons?: number
  featured?: boolean

  /** Ada isinya kalau judul ini punya file video yang bisa diputar. */
  media?: MediaBacking

  /** Label sumber, mis. "Video" atau "katalog demo". */
  sourceLabel?: string
}

export type StreamKind = 'hls' | 'file' | 'embed'

/** Bentuk balikan yang diharapkan <Player>. */
export interface ResolvedStream {
  kind: StreamKind
  src: string
  poster?: string
}

export interface RowDef {
  key: string
  title: string
}

/** Halaman yang sedang aktif. */
export type View = 'home' | 'film' | 'series' | 'mylist'
