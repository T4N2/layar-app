import { memo, type MouseEvent } from 'react'
import type { Title } from '../types'
import { posterGradient } from '../lib/art'
import { useToast } from '../context/toast'
import { useWatchlist } from '../context/watchlist'
import { IconCheck, IconPlay, IconPlus, IconStar } from './Icons'

interface CardProps {
  item: Title
  /** 0..1 — kalau diisi, tampilkan batang progres di bawah kartu. */
  progress?: number
  onOpen: (item: Title) => void
  onPlay: (item: Title) => void
}

function CardBase({ item, progress, onOpen, onPlay }: CardProps) {
  const list = useWatchlist()
  const toast = useToast()
  const inList = list.has(item.id)
  const ext = item.media?.relPath.split('.').pop()

  const badge = item.tags.includes('new')
    ? { cls: 'chip chip-new', text: 'Baru' }
    : item.type === 'series'
      ? { cls: 'chip', text: 'Serial' }
      : ext
        ? { cls: 'chip', text: ext.toUpperCase() }
        : null

  const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const added = list.toggle(item.id)
    toast.show(added ? 'Ditambahkan ke Daftar Saya' : 'Dihapus dari Daftar Saya')
  }

  const handlePlay = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onPlay(item)
  }

  return (
    <article className="card">
      <div className="poster" onClick={() => onOpen(item)}>
        <div className="poster-art" style={{ background: posterGradient(item.colors) }} />

        <div className="poster-top">
          {badge ? <span className={badge.cls}>{badge.text}</span> : <span />}
          {item.rating !== undefined && (
            <span className="rate-badge">
              <IconStar />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="poster-letter">{item.title}</div>

        <div className="poster-hover">
          <button type="button" className="mini-btn" title="Putar" onClick={handlePlay}>
            <IconPlay />
          </button>
          <button
            type="button"
            className={`mini-btn${inList ? ' is-on' : ''}`}
            title={inList ? 'Hapus dari daftar' : 'Tambah ke daftar'}
            onClick={handleToggle}
          >
            {inList ? <IconCheck /> : <IconPlus />}
          </button>
        </div>
      </div>

      <h3 className="card-title">{item.title}</h3>
      <p className="card-sub">
        {item.year} · {item.genres[0]}
      </p>

      {progress !== undefined && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </article>
  )
}

export const Card = memo(CardBase)
