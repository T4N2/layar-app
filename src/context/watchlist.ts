import { createContext, useContext } from 'react'

export interface WatchlistApi {
  ids: string[]
  has: (id: string) => boolean
  /** @returns true kalau baru ditambahkan, false kalau baru dihapus. */
  toggle: (id: string) => boolean
}

export const WatchlistContext = createContext<WatchlistApi | null>(null)

export function useWatchlist(): WatchlistApi {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist harus dipakai di dalam <WatchlistProvider>')
  return ctx
}
