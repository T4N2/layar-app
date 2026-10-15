import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import type { Title } from '../types'
import { resolveStream } from '../lib/stream'
import { clamp, formatTime } from '../lib/format'
import { posterGradient } from '../lib/art'
import { saveProgress } from '../lib/store'
import { useToast } from '../context/toast'
import {
  IconBack,
  IconBack10,
  IconFilm,
  IconFullscreen,
  IconFwd10,
  IconPause,
  IconPlay,
  IconVolume,
} from './Icons'

/** Panjang timeline tiruan (detik) yang dipakai saat belum ada sumber video. */
const DEMO_DURATION = 120
const IDLE_MS = 2800

interface PlayerProps {
  item: Title
  onClose: () => void
}

export default function Player({ item, onClose }: PlayerProps) {
  const stream = useMemo(() => resolveStream(item, {}), [item])
  const hasSource = stream !== null

  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(hasSource ? 0 : DEMO_DURATION)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [idle, setIdle] = useState(false)
  const toast = useToast()

  /* Nilai terbaru untuk dibaca dari dalam timer, disinkronkan lewat effect. */
  const playingRef = useRef(playing)
  const progressRef = useRef({ id: item.id, current: 0, duration })
  const idleTimer = useRef<number | null>(null)

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    progressRef.current = { id: item.id, current, duration }
  }, [item.id, current, duration])

  const restartIdleTimer = useCallback(() => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS)
  }, [])

  const wake = useCallback(() => {
    setIdle(false)
    if (!playingRef.current) return
    restartIdleTimer()
  }, [restartIdleTimer])

  /* ---------------- timeline tiruan ---------------- */
  useEffect(() => {
    if (hasSource || !playing || duration <= 0) return
    const id = window.setInterval(() => {
      setCurrent((prev) => {
        const next = prev + 1
        if (next >= duration) {
          setPlaying(false)
          return duration
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [hasSource, playing, duration])

  /* ---------------- video sungguhan ---------------- */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (!playing) {
      v.pause()
      return
    }

    v.play().catch((err: unknown) => {
      setPlaying(false)
      // Kebijakan autoplay browser: putar butuh interaksi pengguna dulu.
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.show('Tekan tombol putar untuk memulai')
      }
    })
  }, [playing, toast])

  /* loadedmetadata bisa terlanjur kebakaran sebelum React pasang pendengar
     (video dibuat dengan src langsung). Sinkronkan lewat beberapa event
     sekaligus supaya durasi pasti terisi. */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const sync = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration)
    }

    sync()
    v.addEventListener('loadedmetadata', sync)
    v.addEventListener('canplay', sync)
    v.addEventListener('durationchange', sync)
    return () => {
      v.removeEventListener('loadedmetadata', sync)
      v.removeEventListener('canplay', sync)
      v.removeEventListener('durationchange', sync)
    }
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = volume
    v.muted = muted
  }, [volume, muted])

  /* Browser tanpa dukungan HLS native butuh hls.js. */
  const hlsUnsupported = useMemo(() => {
    if (!stream || stream.kind !== 'hls') return false
    const probe = document.createElement('video')
    return probe.canPlayType('application/vnd.apple.mpegurl') === ''
  }, [stream])

  /* ---------------- sembunyikan kontrol saat diam ---------------- */
  useEffect(() => {
    if (!playing) {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current)
      return
    }
    restartIdleTimer()
    return () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current)
    }
  }, [playing, restartIdleTimer])

  /* ---------------- kunci scroll + simpan progres saat keluar ---------------- */
  useEffect(() => {
    document.body.classList.add('no-scroll')
    return () => {
      document.body.classList.remove('no-scroll')
      const p = progressRef.current
      if (p.duration > 0) saveProgress(p.id, p.current / p.duration)
    }
  }, [])

  /* ---------------- waktu ---------------- */
  const applyTime = useCallback(
    (value: number) => {
      const next = clamp(value, 0, duration)
      setCurrent(next)
      const v = videoRef.current
      if (v && Number.isFinite(v.duration)) v.currentTime = next
    },
    [duration],
  )

  const seekBy = useCallback((delta: number) => applyTime(current + delta), [applyTime, current])

  const togglePlay = useCallback(() => {
    setPlaying((p) => !p)
    setIdle(false)
  }, [])

  /** Simpan posisi terakhir SEBELUM menutup, supaya baris "Lanjutkan Tonton" langsung segar. */
  const handleClose = useCallback(() => {
    const p = progressRef.current
    if (p.duration > 0) saveProgress(p.id, p.current / p.duration)
    onClose()
  }, [onClose])

  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }
      if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
        wake()
        return
      }
      if (e.key === 'ArrowLeft') {
        seekBy(-10)
        wake()
        return
      }
      if (e.key === 'ArrowRight') {
        seekBy(10)
        wake()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose, seekBy, togglePlay, wake])

  /* ---------------- layar penuh ---------------- */
  const toggleFullscreen = () => {
    const el = stageRef.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void el.requestFullscreen?.()
    }
  }

  const handleSeekClick = (e: MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    applyTime(((e.clientX - rect.left) / rect.width) * duration)
  }

  const ratio = duration > 0 ? current / duration : 0
  const sub = `${item.year} · ${item.genres.join(', ')}${item.type === 'series' ? ' · Serial' : ''}`

  return (
    <div
      className={`player${idle && playing ? ' is-idle' : ''}`}
      onMouseMove={wake}
      role="dialog"
      aria-modal="true"
      aria-label="Pemutar"
    >
      <div ref={stageRef} className="player-stage">
        {stream ? (
          <video
            ref={videoRef}
            className="player-video"
            src={stream.src}
            poster={stream.poster}
            playsInline
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <div className="player-canvas">
            <div className="bg" style={{ background: posterGradient(item.colors) }} />
            <div className="player-msg">
              <div className="icon">
                <IconFilm />
              </div>
              <h4>Belum ada sumber video</h4>
              <p>
                Ini demo UI. Kontrol di bawah memperagakan timeline {DEMO_DURATION} detik. Isi{' '}
                <code>resolveStream()</code> di <code>src/lib/stream.ts</code> untuk memutar video
                sungguhan.
              </p>
            </div>
          </div>
        )}

        {hlsUnsupported && (
          <div className="player-warn">
            Browser ini belum bisa memutar HLS sendiri. Tambahkan <code>hls.js</code> untuk stream{' '}
            <code>.m3u8</code>.
          </div>
        )}

        <div className="player-top">
          <button type="button" className="player-back" aria-label="Kembali" onClick={handleClose}>
            <IconBack />
          </button>
          <div className="player-titles">
            <h3>{item.title}</h3>
            <p className="muted">{sub}</p>
          </div>
        </div>

        {!playing && (
          <button type="button" className="player-bigplay" aria-label="Putar" onClick={togglePlay}>
            <IconPlay />
          </button>
        )}

        <div className="player-controls">
          <div className="seek" onClick={handleSeekClick}>
            <div className="seek-track">
              <div className="seek-fill" style={{ width: `${ratio * 100}%` }} />
              <div className="seek-knob" style={{ left: `${ratio * 100}%` }} />
            </div>
            <div className="seek-times">
              <span>{formatTime(current)}</span>
              <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
            </div>
          </div>

          <div className="controls-row">
            <button type="button" aria-label="Putar/Jeda" onClick={togglePlay}>
              {playing ? <IconPause /> : <IconPlay />}
            </button>
            <button type="button" aria-label="Mundur 10 detik" onClick={() => seekBy(-10)}>
              <IconBack10 />
            </button>
            <button type="button" aria-label="Maju 10 detik" onClick={() => seekBy(10)}>
              <IconFwd10 />
            </button>

            <div className="vol">
              <button type="button" aria-label="Bisukan" onClick={() => setMuted((m) => !m)}>
                <IconVolume />
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((muted ? 0 : volume) * 100)}
                aria-label="Volume"
                onChange={(e) => {
                  const v = Number(e.target.value) / 100
                  setVolume(v)
                  setMuted(v === 0)
                }}
              />
            </div>

            <span className="spacer" />
            <span className="badge-soft">{stream ? stream.kind.toUpperCase() : 'DEMO'}</span>
            <button type="button" aria-label="Layar penuh" onClick={toggleFullscreen}>
              <IconFullscreen />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
