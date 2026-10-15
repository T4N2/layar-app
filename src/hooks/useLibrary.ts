import { useCallback, useEffect, useState } from 'react'
import type { Title } from '../types'
import { CATALOG, DEMO_SOURCE_LABEL } from '../data/catalog'
import { mediaToTitle } from '../lib/library'
import { loadLibrary } from '../lib/sources'

export type LibraryStatus = 'loading' | 'ready' | 'demo'

interface LibraryState {
  status: LibraryStatus
  titles: Title[]
  sourceLabel: string
}

const INITIAL: LibraryState = { status: 'loading', titles: [], sourceLabel: '' }

export function useLibrary() {
  const [state, setState] = useState<LibraryState>(INITIAL)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    loadLibrary()
      .then((lib) => {
        if (cancelled) return
        setState(
          lib
            ? { status: 'ready', titles: lib.items.map(mediaToTitle), sourceLabel: lib.source.label }
            : { status: 'demo', titles: CATALOG, sourceLabel: DEMO_SOURCE_LABEL },
        )
      })
      .catch(() => {
        if (cancelled) return
        setState({ status: 'demo', titles: CATALOG, sourceLabel: DEMO_SOURCE_LABEL })
      })

    return () => {
      cancelled = true
    }
  }, [nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { ...state, reload }
}
