import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readList, writeList } from '../lib/store'
import { WatchlistContext, type WatchlistApi } from './watchlist'

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => readList())

  useEffect(() => {
    writeList(ids)
  }, [ids])

  const has = useCallback((id: string) => ids.includes(id), [ids])

  const toggle = useCallback(
    (id: string) => {
      const added = !ids.includes(id)
      setIds(added ? [...ids, id] : ids.filter((x) => x !== id))
      return added
    },
    [ids],
  )

  const api = useMemo<WatchlistApi>(() => ({ ids, has, toggle }), [ids, has, toggle])

  return <WatchlistContext.Provider value={api}>{children}</WatchlistContext.Provider>
}
