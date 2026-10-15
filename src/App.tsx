import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import type { Title, View } from './types'
import { buildRows } from './lib/library'
import { readProgress } from './lib/store'
import { useLibrary } from './hooks/useLibrary'
import { ToastProvider } from './context/ToastProvider'
import { useToast } from './context/toast'
import { WatchlistProvider } from './context/WatchlistProvider'
import { useWatchlist } from './context/watchlist'
import { Header, type NavItem } from './components/Header'
import { Hero } from './components/Hero'
import { Row } from './components/Row'
import { Card } from './components/Card'
import { DetailModal } from './components/DetailModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/app.css'

/** Player dimuat terpisah supaya bundle awal tetap kecil. */
const Player = lazy(() => import('./components/Player'))

/* ---------------- daftar hasil (grid) ---------------- */
interface GridProps {
  title: string
  items: Title[]
  empty: string
  progressOf: (id: string) => number
  onOpen: (item: Title) => void
  onPlay: (item: Title) => void
}

function Grid({ title, items, empty, progressOf, onOpen, onPlay }: GridProps) {
  return (
    <section className="listing">
      <h2 className="section-title">{title}</h2>
      {items.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <div className="grid">
          {items.map((item) => (
            <Card
              key={item.id}
              item={item}
              progress={progressOf(item.id)}
              onOpen={onOpen}
              onPlay={onPlay}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------------- shell ---------------- */
function Shell() {
  const toast = useToast()
  const list = useWatchlist()
  const { status, titles, sourceLabel, reload } = useLibrary()

  const [view, setView] = useState<View>('home')
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<Title | null>(null)
  const [playing, setPlaying] = useState<Title | null>(null)
  const [progress, setProgress] = useState(() => readProgress())

  const isDemo = status === 'demo'
  const progressOf = useCallback((id: string) => progress[id] ?? 0, [progress])

  /* ---- aksi ---- */
  const openDetail = useCallback((item: Title) => setDetail(item), [])
  const closeDetail = useCallback(() => setDetail(null), [])

  const play = useCallback((item: Title) => {
    setDetail(null)
    setPlaying(item)
  }, [])

  const closePlayer = useCallback(() => {
    setPlaying(null)
    setProgress(readProgress()) // segarkan baris "Lanjutkan Tonton"
  }, [])

  const changeView = useCallback((next: View) => {
    setQuery('')
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const goHome = useCallback(() => {
    setQuery('')
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  /* ---- data turunan ---- */
  const byId = useMemo(() => new Map(titles.map((t) => [t.id, t])), [titles])

  const mylist = useMemo(
    () => list.ids.map((id) => byId.get(id)).filter((t): t is Title => t !== undefined),
    [list.ids, byId],
  )

  const continuing = useMemo(
    () =>
      Object.entries(progress)
        .filter(([, ratio]) => ratio > 0.02 && ratio < 0.98)
        .map(([id]) => byId.get(id))
        .filter((t): t is Title => t !== undefined),
    [progress, byId],
  )

  const rows = useMemo(
    () => buildRows(titles, isDemo, { continuing, mylist }),
    [titles, isDemo, continuing, mylist],
  )

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return titles.filter((t) =>
      `${t.title} ${t.genres.join(' ')} ${t.cast.join(' ')} ${t.year} ${t.media?.relPath ?? ''}`
        .toLowerCase()
        .includes(q),
    )
  }, [titles, query])

  const heroItem = useMemo(() => titles.find((t) => t.featured) ?? titles[0] ?? null, [titles])

  const nav = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [{ key: 'home', label: 'Beranda' }]
    if (isDemo) {
      items.push({ key: 'film', label: 'Film' }, { key: 'series', label: 'Serial' })
    }
    items.push({ key: 'mylist', label: 'Daftar Saya' })
    return items
  }, [isDemo])

  const visibleRows = useMemo(() => {
    if (view === 'film') return rows.filter((r) => r.key === 'popular')
    if (view === 'series') return rows.filter((r) => r.key === 'series')
    return rows
  }, [view, rows])

  const searching = query.trim() !== ''

  return (
    <>
      <Header
        nav={nav}
        view={view}
        query={query}
        sourceLabel={status === 'loading' ? 'memuat…' : sourceLabel}
        onViewChange={changeView}
        onQueryChange={setQuery}
        onHome={goHome}
        onAvatarClick={() => toast.show('Profil demo — belum ada login')}
      />

      <main>
        {searching ? (
          <Grid
            title={`Hasil pencarian "${query.trim()}"`}
            items={hits}
            empty="Tidak ada yang cocok. Coba kata kunci lain."
            progressOf={progressOf}
            onOpen={openDetail}
            onPlay={play}
          />
        ) : view === 'mylist' ? (
          <Grid
            title="Daftar Saya"
            items={mylist}
            empty="Belum ada judul di daftar kamu. Tekan tombol + pada kartu untuk menambah."
            progressOf={progressOf}
            onOpen={openDetail}
            onPlay={play}
          />
        ) : (
          <>
            {view === 'home' && heroItem && (
              <Hero item={heroItem} onPlay={play} onInfo={openDetail} />
            )}
            <div className="rows">
              {visibleRows.map((row) => (
                <Row
                  key={row.key}
                  title={row.title}
                  items={row.items}
                  showProgress={row.showProgress}
                  progressOf={progressOf}
                  onOpen={openDetail}
                  onPlay={play}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="site-footer">
        <p>
          <strong>LAYAR</strong> — media player demo. Sumber aktif:{' '}
          <code>{status === 'loading' ? 'memuat…' : sourceLabel}</code>
          {status === 'ready' && ` · ${titles.length} file`}
          {status === 'demo' && ' · jalankan pnpm media untuk memakai folder videomu'}
        </p>
        <p className="muted">
          {isDemo
            ? 'Katalog demo tidak punya file video — tombol Putar hanya membuka player kosong.'
            : 'Daftar file diambil dari server media lokal. Titik sambung sumber ada di src/lib/stream.ts.'}
        </p>
        <p>
          <button type="button" className="link-btn" onClick={reload}>
            Muat ulang katalog
          </button>
        </p>
      </footer>

      {detail && <DetailModal item={detail} onClose={closeDetail} onPlay={play} />}

      {playing && (
        <Suspense fallback={<div className="player-loading">Memuat pemutar…</div>}>
          <Player key={playing.id} item={playing} onClose={closePlayer} />
        </Suspense>
      )}
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <WatchlistProvider>
          <Shell />
        </WatchlistProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
