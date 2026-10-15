/* ============================================================
   TITIK SAMBUNG SUMBER VIDEO.

   Ini satu-satunya tempat aplikasi bertanya "video mana yang
   harus diputar". Komponen <Player> tidak tahu-menahu soal
   folder lokal, server, atau katalog demo.

   Sekarang isinya:
     - item punya file  -> kembalikan streamUrl-nya (kind 'file')
     - .m3u8            -> kind 'hls' (Player memuat hls.js otomatis)
     - item tanpa file  -> null, player menampilkan placeholder
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
    const src = item.media.streamUrl
    // HLS: .m3u8 -> butuh hls.js di browser non-Safari (ditangani <Player>).
    if (/\.m3u8($|\?)/i.test(src)) {
      return { kind: 'hls', src }
    }
    return { kind: 'file', src }
  }

  // Belum ada file untuk judul ini (mis. katalog demo) -> placeholder.
  return null
}
