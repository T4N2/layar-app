import type { Title } from '../types'
import { posterGradient } from '../lib/art'
import { IconInfo, IconPlay, IconStar } from './Icons'

interface HeroProps {
  item: Title
  onPlay: (item: Title) => void
  onInfo: (item: Title) => void
}

export function Hero({ item, onPlay, onInfo }: HeroProps) {
  return (
    <section className="hero" aria-label="Sorotan">
      <div className="hero-bg" style={{ background: posterGradient(item.colors) }} />
      <div className="hero-inner">
        <div className="hero-body">
          <span className="hero-kicker">Sorotan Minggu Ini</span>
          <h1 className="hero-title">{item.title}</h1>

          <div className="hero-meta">
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
            <span className="dot" />
            {item.genres.map((g) => (
              <span className="pill" key={g}>
                {g}
              </span>
            ))}
          </div>

          <p className="hero-synopsis">{item.synopsis}</p>

          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => onPlay(item)}>
              <IconPlay />
              Putar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onInfo(item)}>
              <IconInfo />
              Selengkapnya
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
