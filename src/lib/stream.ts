/* ============================================================
   TITIK SAMBUNG SUMBER VIDEO.

   Ini satu-satunya tempat aplikasi bertanya "video mana yang
   harus diputar". Komponen <Player> tidak tahu-menahu soal
   folder lokal, server, atau katalog demo.

   Sekarang isinya:
     - item punya file  -> kembalikan streamUrl-nya (kind 'file')
     - item tanpa file  -> null, player menampilkan placeholder

   Mau tambah HLS? Cukup bercabang di sini:
     if (item.media.relPath.endsWith('.m3u8'))
       return { kind: 'hls', src: item.media.streamUrl }
   ============================================================ */

import type { ResolvedStream, Title } from '../types'

export interface ResolveOptions {
  season?: number
  episode?: number
}

/**
 * @param item  entri katalog (lihat src/types.ts)
 * @param opts  { season, episode } untuk serial
 */
export function resolveStream(
  item: Title,
  opts: ResolveOptions = {},
): ResolvedStream | null {
  void opts

  if (item.media && item.media.streamUrl) {
    return { kind: 'file', src: item.media.streamUrl }
  }

  // Belum ada file untuk judul ini (mis. katalog demo) -> placeholder.
  return null
}
