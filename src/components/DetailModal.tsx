import { useEffect, useRef } from 'react'
import type { Title } from '../types'
import { posterGradient } from '../lib/art'
import { formatBytes } from '../lib/format'
import { useToast } from '../context/toast'
import { useWatchlist } from '../context/watchlist'
import { IconCheck, IconPlay, IconPlus, IconStar } from './Icons'

interface DetailModalProps {
  item: Title
  onClose: () => void
  onPlay: (item: Title) => void
}

export function DetailModal({ item, onClose, onPlay }: DetailModalProps) {
  const list = useWatchlist()
  const toast = useToast()
  const inList = list.has(item.id)
  const closeRef = useRef<HTMLButtonElement>(null)

  const isSeries = item.type === 'series'
  const playable = item.media !== undefined

  useEffect(() => {
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [onClose])

  const handleToggle = () => {
    const added = list.toggle(item.id)
    toast.show(added ? 'Ditambahkan ke Daftar Saya' : 'Dihapus dari Daftar Saya')
    onClose()
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel">
        <button
          ref={closeRef}
          type="button"
          className="modal-close"
          aria-label="Tutup"
          onClick={onClose}
        >
          ×
        </button>

        <div className="detail-hero">
          <div className="detail-hero-art" style={{ background: posterGradient(item.colors) }} />
        </div>

        <div className="detail-body">
          <div className="detail-grid">
            <div className="detail-poster">
              <div className="poster-art" style={{ background: posterGradient(item.colors) }} />
            </div>

            <div className="detail-info">
              <h2 id="detail-title">{item.title}</h2>

              <div className="detail-meta">
                {item.rating !== undefined && (
                  <>
                    <span className="score">
                      <IconStar />
                      {item.rating.toFixed(1)}
                    </span>
                    <span className="dot" />
                  </>
                )}
                <span>{item.year}</span>
                {item.duration && (
                  <>
                    <span className="dot" />
                    <span>{item.duration}</span>
                  </>
                )}
                {isSeries && item.seasons !== undefined && (
                  <>
                    <span className="dot" />
                    <span>{item.seasons} musim</span>
                  </>
                )}
                <span className="dot" />
                <span>{isSeries ? 'Serial' : 'Film'}</span>
              </div>

              <div className="detail-actions">
                <button type="button" className="btn btn-primary" onClick={() => onPlay(item)}>
                  <IconPlay />
                  Putar
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleToggle}>
                  {inList ? <IconCheck /> : <IconPlus />}
                  {inList ? 'Di Daftar Saya' : 'Daftar Saya'}
                </button>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Sinopsis</h4>
            <p>{item.synopsis}</p>
          </div>

          {item.media && (
            <div className="detail-section">
              <h4>File</h4>
              <div className="cast-list">
                <span className="cast">{item.media.relPath}</span>
                <span className="cast">{formatBytes(item.media.sizeBytes)}</span>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h4>Genre</h4>
            <div className="cast-list">
              {item.genres.map((g) => (
                <span className="cast" key={g}>
                  {g}
                </span>
              ))}
            </div>
          </div>

          {item.cast.length > 0 && (
            <div className="detail-section">
              <h4>Pemain</h4>
              <div className="cast-list">
                {item.cast.map((c) => (
                  <span className="cast" key={c}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {playable ? (
            <div className="note">
              <strong>File lokal.</strong> Diputar langsung dari server media di laptop kamu.
              Kalau seek tidak jalan atau video diam, pastikan server media masih hidup
              (<code>pnpm media</code>).
            </div>
          ) : (
            <div className="note">
              <strong>Catatan demo:</strong> judul ini tidak punya file video, jadi tombol Putar
              hanya membuka player kosong. Jalankan <code>pnpm media</code> untuk memakai folder
              video kamu sendiri.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
