/* ============================================================
   Kontrak sumber media.

   Satu bentuk data, dua (atau lebih) backend:
     - localApi  -> server di laptop sendiri, membaca folder
     - remoteApi -> server online, kontrak sama

   Frontend tidak tahu bedanya. Selama balikannya MediaItem[],
   UI dan player jalan tanpa perubahan.
   ============================================================ */

export interface MediaItem {
  id: string
  title: string
  folder: string
  relPath: string
  ext: string
  sizeBytes: number
  /** ISO 8601 */
  modified: string
  streamUrl: string
}

export interface LibraryPayload {
  root: string
  count: number
  items: MediaItem[]
}

export interface MediaSource {
  id: string
  label: string
  /** false kalau base URL-nya belum diisi — sumber ini dilewati. */
  configured: () => boolean
  list: () => Promise<MediaItem[]>
}
