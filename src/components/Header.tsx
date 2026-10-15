import { useEffect, useState } from 'react'
import type { View } from '../types'
import { IconSearch } from './Icons'

export interface NavItem {
  key: View
  label: string
}

interface HeaderProps {
  nav: NavItem[]
  view: View
  query: string
  sourceLabel: string
  onViewChange: (view: View) => void
  onQueryChange: (query: string) => void
  onHome: () => void
  onAvatarClick: () => void
}

export function Header({
  nav,
  view,
  query,
  sourceLabel,
  onViewChange,
  onQueryChange,
  onHome,
  onAvatarClick,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header id="header" className={scrolled ? 'is-scrolled' : ''}>
      <div className="header-inner">
        <button type="button" className="brand" onClick={onHome}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="brand-mark">
            <rect x="1.5" y="3.5" width="21" height="14" rx="2.5" />
            <path d="M10 8.2v6.6l5.5-3.3z" className="brand-play" />
            <path d="M7 20.5h10" className="brand-stand" />
          </svg>
          <span>LAYAR</span>
        </button>

        <nav className="nav">
          {nav.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-link${view === item.key ? ' is-active' : ''}`}
              onClick={() => onViewChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-right">
          {sourceLabel !== '' && (
            <span className="source-chip" title="Sumber katalog yang sedang dipakai">
              {sourceLabel}
            </span>
          )}

          <div className="search">
            <IconSearch />
            <input
              type="search"
              value={query}
              placeholder="Cari judul, genre, pemain…"
              autoComplete="off"
              aria-label="Cari"
              onChange={(e) => onQueryChange(e.target.value)}
            />
            {query !== '' && (
              <button
                type="button"
                className="search-clear"
                aria-label="Bersihkan pencarian"
                onClick={() => onQueryChange('')}
              >
                ×
              </button>
            )}
          </div>

          <button type="button" className="avatar" title="Profil demo" onClick={onAvatarClick}>
            D
          </button>
        </div>
      </div>
    </header>
  )
}
