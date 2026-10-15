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
  IconCC,
  IconFilm,
  IconFullscreen,
  IconFwd10,
  IconPause,
  IconPip,
  IconPlay,
  IconSpeed,
  IconVolume,
} from './Icons'

/** Panjang timeline tiruan (detik) yang dipakai saat belum ada sumber video. */
const DEMO_DURATION = 120
const IDLE_MS = 2800
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

interface PlayerProps {
  item: Title
  onClose: () => void
}

export default function Player({ item, onClose }: PlayerProps) {
  const stream = useMemo(() => resolveStream(item, {}), [item])
  const hasSource = stream !== null
  const isHls = stream?.kind === 'hls'

  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<{ destroy: () => void } | null>(null)

  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(hasSource ? 0 : DEMO_DURATION)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [waiting, setWaiting] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [ccOn, setCcOn] = useState(true)
  const [idle, setIdle] = useState(false)
  const [hlsError, setHlsError] = useState<string | null>(null)
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

  /* ---------------- HLS (hls.js, dimuat malas) ---------------- */
  useEffect(() => {
    const v = videoRef.current
    if (!v || !stream || stream.kind !== 'hls') return

    // Safari / iOS memutar HLS native — langsung pakai src.
    if (v.canPlayType('application/vnd.apple.mpegurl') !== '') {
      v.src = stream.src
      return
    }

    let cancelled = false
    setHlsError(null)

    void import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return
      if (!Hls.isSupported()) {
        setHlsError('Browser ini tidak mendukung HLS.')
        return
      }
      const hls = new Hls({
        // Pulih otomatis dari gangguan jaringan ringan.
        fragLoadingMaxRetry: 4,
        manifestLoadingMaxRetry: 2,
      })
      hlsRef.current = hls
      hls.loadSource(stream.src)
      hls.attachMedia(v)
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return
        // Coba pulih sekali untuk error jaringan/media; kalau gagal, menyerah.
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad()
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError()
        } else {
          hls.destroy()
          hlsRef.current = null
          setHlsError('Stream HLS gagal dimuat. Coba lagi nanti.')
        }
      })
    })

    return () => {
      cancelled = true
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [stream])

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
    const syncBuffered = () => {
      try {
        const b = v.buffered
        if (b.length > 0) setBufferedEnd(b.end(b.length - 1))
      } catch {
        /* abaikan */
      }
    }
    const onWaiting = () => setWaiting(true)
    const onPlaying = () => setWaiting(false)

    sync()
    v.addEventListener('loadedmetadata', sync)
    v.addEventListener('canplay', sync)
    v.addEventListener('durationchange', sync)
    v.addEventListener('progress', syncBuffered)
    v.addEventListener('timeupdate', syncBuffered)
    v.addEventListener('waiting', onWaiting)
    v.addEventListener('playing', onPlaying)
    v.addEventListener('stalled', onWaiting)
    return () => {
      v.removeEventListener('loadedmetadata', sync)
      v.removeEventListener('canplay', sync)
      v.removeEventListener('durationchange', sync)
      v.removeEventListener('progress', syncBuffered)
      v.removeEventListener('timeupdate', syncBuffered)
      v.removeEventListener('waiting', onWaiting)
      v.removeEventListener('playing', onPlaying)
      v.removeEventListener('stalled', onWaiting)
    }
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = volume
    v.muted = muted
  }, [volume, muted])

  useEffect(() => {
    const v = videoRef.current
    if (v) v.playbackRate = speed
  }, [speed])

  /* Subtitle: tampil/sembunyi via track.mode. */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    for (const t of Array.from(v.textTracks)) {
      t.mode = ccOn ? 'showing' : 'disabled'
    }
  }, [ccOn, stream])

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
        if (speedOpen) {
          setSpeedOpen(false)
          return
        }
        handleClose()
        return
      }
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        togglePlay()
        wake()
        return
      }
      if (e.key === 'ArrowLeft' || e.key === 'j') {
        seekBy(-10)
        wake()
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'l') {
        seekBy(10)
        wake()
        return
      }
      if (e.key === 'f') {
        toggleFullscreen()
        wake()
        return
      }
      if (e.key === 'm') {
        setMuted((m) => !m)
        wake()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleClose, seekBy, togglePlay, wake, speedOpen])

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

  /* ---------------- picture-in-picture ---------------- */
  const togglePip = async () => {
    const v = videoRef.current
    if (!v) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        await v.requestPictureInPicture()
      } else {
        toast.show('Picture-in-picture tidak didukung browser ini')
      }
    } catch {
      toast.show('Gagal mengaktifkan picture-in-picture')
    }
  }

  const handleSeekClick = (e: MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    applyTime(((e.clientX - rect.left) / rect.width) * duration)
  }

  const ratio = duration > 0 ? current / duration : 0
  const bufferedRatio = duration > 0 ? clamp(bufferedEnd / duration, 0, 1) : 0
  const sub = `${item.year} · ${item.genres.join(', ')}${item.type === 'series' ? ' · Serial' : ''}`
  const hasSubtitles = !!stream?.subtitles?.length

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
            src={isHls ? undefined : stream.src}
            poster={stream.poster}
            playsInline
            crossOrigin="anonymous"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onEnded={() => setPlaying(false)}
          >
            {stream.subtitles?.map((s) => (
              <track key={s.lang} kind="subtitles" src={s.src} srcLang={s.lang} label={s.label} />
            ))}
          </video>
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

        {hlsError ? (
          <div className="player-canvas">
            <div className="player-msg">
              <h4>Stream gagal dimuat</h4>
              <p>{hlsError}</p>
            </div>
          </div>
        ) : (
          waiting && playing && <div className="player-spinner" aria-label="Memuat" />
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

        {!playing && !waiting && (
          <button type="button" className="player-bigplay" aria-label="Putar" onClick={togglePlay}>
            <IconPlay />
          </button>
        )}

        <div className="player-controls">
          <div className="seek" onClick={handleSeekClick}>
            <div className="seek-track">
              <div className="seek-buffered" style={{ width: `${bufferedRatio * 100}%` }} />
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

            {hasSubtitles && (
              <button
                type="button"
                aria-label="Subtitle"
                aria-pressed={ccOn}
                onClick={() => setCcOn((c) => !c)}
                style={{ opacity: ccOn ? 1 : 0.45 }}
              >
                <IconCC />
              </button>
            )}

            <div className="speed-wrap">
              <button
                type="button"
                aria-label="Kecepatan putar"
                aria-expanded={speedOpen}
                onClick={() => setSpeedOpen((o) => !o)}
              >
                <IconSpeed />
              </button>
              {speedOpen && (
                <div className="speed-menu" role="menu" aria-label="Kecepatan putar">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="menuitemradio"
                      aria-checked={speed === s}
                      className={speed === s ? 'is-active' : ''}
                      onClick={() => {
                        setSpeed(s)
                        setSpeedOpen(false)
                        wake()
                      }}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              )}
            </div>
            {speed !== 1 && <span className="speed-label muted">{speed}×</span>}

            <span className="badge-soft">{stream ? stream.kind.toUpperCase() : 'DEMO'}</span>

            <button type="button" aria-label="Picture-in-picture" onClick={togglePip}>
              <IconPip />
            </button>
            <button type="button" aria-label="Layar penuh" onClick={toggleFullscreen}>
              <IconFullscreen />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
