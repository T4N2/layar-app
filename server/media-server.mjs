#!/usr/bin/env node
/* ============================================================
   Server media lokal untuk LAYAR.

   Tugasnya cuma dua:
     GET /api/library      -> daftar file video di MEDIA_ROOT
     GET /stream/<id>      -> kirim isi file, dukung HTTP Range (wajib untuk seek)

   Kenapa dipisah dari frontend:
     Kontrak ini sama persis dengan yang nanti dipakai server online.
     Frontend tidak tahu-menahu bedanya lokal atau remote.

   Jalankan:
     node server/media-server.mjs
     MEDIA_ROOT="D:/Film/Video" MEDIA_PORT=5179 node server/media-server.mjs

   Catatan keamanan:
   - Bind ke 127.0.0.1 saja, tidak ke 0.0.0.0.
   - TIDAK ada header CORS. Sengaja: tanpa itu, situs lain di browser kamu
     tidak bisa membaca isi folder ini lewat localhost. Akses hanya lewat
     proxy Vite (same-origin).
   - URL stream memakai id hasil hash, bukan path. Tidak ada path dari
     pengguna yang masuk ke sistem file.
   ============================================================ */

import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { readdir, realpath, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(process.env.MEDIA_ROOT ?? 'D:/Film/Video')
const PORT = Number(process.env.MEDIA_PORT ?? 5179)
const HOST = process.env.MEDIA_HOST ?? '127.0.0.1'
const CACHE_MS = 15_000
/** Kalau ada, isi folder ini ikut disajikan (hasil `pnpm build`). */
const DIST = path.resolve(process.env.MEDIA_DIST ?? path.join(process.cwd(), 'dist'))

const VIDEO_EXT = new Set(['.mp4', '.m4v', '.mkv', '.webm', '.mov', '.avi', '.ogv', '.ts'])

const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

const MIME = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.ogv': 'video/ogg',
  '.ts': 'video/mp2t',
}

/* ---------------- indeks ---------------- */

/** @type {Map<string, {rel: string, abs: string, size: number, mtime: string}>} */
let index = new Map()
let lastScan = 0

function idOf(rel) {
  return createHash('sha1').update(rel).digest('hex').slice(0, 16)
}

async function walk(dir, base = '') {
  const out = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const abs = path.join(dir, entry.name)
    const rel = base ? `${base}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      out.push(...(await walk(abs, rel)))
    } else if (entry.isFile() && VIDEO_EXT.has(path.extname(entry.name).toLowerCase())) {
      try {
        const info = await stat(abs)
        out.push({ rel, abs, size: info.size, mtime: info.mtime.toISOString() })
      } catch {
        /* file hilang di tengah scan — lewati */
      }
    }
  }
  return out
}

async function ensureIndex(force = false) {
  if (!force && index.size > 0 && Date.now() - lastScan < CACHE_MS) return
  const files = await walk(ROOT)
  index = new Map(files.map((f) => [idOf(f.rel), f]))
  lastScan = Date.now()
}

/** Apakah `p` benar-benar berada di dalam `root`? */
function isInside(root, p) {
  const rel = path.relative(root, p)
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}

function titleOf(rel) {
  const base = path.posix.basename(rel)
  return base
    .replace(/\.[a-z0-9]{2,4}$/i, '')
    .replace(/[._]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function folderOf(rel) {
  const dir = path.posix.dirname(rel)
  return dir === '.' ? path.basename(ROOT) : dir
}

/* ---------------- handler ---------------- */

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

async function handleLibrary(res, refresh) {
  await ensureIndex(refresh)

  const items = [...index.entries()]
    .map(([id, f]) => ({
      id,
      title: titleOf(f.rel),
      folder: folderOf(f.rel),
      relPath: f.rel,
      ext: path.extname(f.rel).toLowerCase(),
      sizeBytes: f.size,
      modified: f.mtime,
      streamUrl: `/media/stream/${id}`,
    }))
    .sort((a, b) => b.modified.localeCompare(a.modified))

  sendJson(res, 200, { root: path.basename(ROOT), count: items.length, items })
}

async function handleStream(req, res, id) {
  await ensureIndex()
  const entry = index.get(id)
  if (!entry) {
    sendJson(res, 404, { error: 'id tidak dikenal' })
    return
  }

  // Lapis kedua: pastikan file nyatanya masih di dalam ROOT (jaga symlink).
  let realRoot
  let realFile
  try {
    realRoot = await realpath(ROOT)
    realFile = await realpath(entry.abs)
  } catch {
    sendJson(res, 404, { error: 'file tidak terbaca' })
    return
  }
  if (!isInside(realRoot, realFile)) {
    sendJson(res, 403, { error: 'di luar folder media' })
    return
  }

  let info
  try {
    info = await stat(realFile)
  } catch {
    sendJson(res, 404, { error: 'file tidak ada' })
    return
  }

  const total = info.size
  const type = MIME[path.extname(realFile).toLowerCase()] ?? 'application/octet-stream'
  const range = req.headers.range

  if (!range) {
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': total,
      'Accept-Ranges': 'bytes',
    })
    createReadStream(realFile).pipe(res)
    return
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim())
  if (!match) {
    res.writeHead(416, { 'Content-Range': `bytes */${total}` })
    res.end()
    return
  }

  let start = match[1] === '' ? null : Number(match[1])
  let end = match[2] === '' ? null : Number(match[2])

  if (start === null && end === null) {
    res.writeHead(416, { 'Content-Range': `bytes */${total}` })
    res.end()
    return
  }
  if (start === null) {
    // bentuk suffix: bytes=-500 -> 500 byte terakhir
    start = Math.max(0, total - end)
    end = total - 1
  }
  if (end === null || end >= total) end = total - 1

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
    res.writeHead(416, { 'Content-Range': `bytes */${total}` })
    res.end()
    return
  }

  res.writeHead(206, {
    'Content-Type': type,
    'Content-Range': `bytes ${start}-${end}/${total}`,
    'Content-Length': end - start + 1,
    'Accept-Ranges': 'bytes',
  })
  createReadStream(realFile, { start, end }).pipe(res)
}

/* ---------------- berkas statis (hasil build) ---------------- */

async function serveStatic(res, pathname) {
  const target = pathname === '/' ? '/index.html' : pathname
  const abs = path.resolve(DIST, `.${target}`)

  if (!isInside(DIST, abs)) return false

  try {
    const info = await stat(abs)
    if (!info.isFile()) return false
    res.writeHead(200, {
      'Content-Type': STATIC_MIME[path.extname(abs).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': info.size,
    })
    createReadStream(abs).pipe(res)
    return true
  } catch {
    /* jatuh ke fallback SPA di bawah */
  }

  // Rute yang tidak ada file-nya -> kirim index.html (SPA).
  const index = path.join(DIST, 'index.html')
  try {
    const info = await stat(index)
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': info.size,
    })
    createReadStream(index).pipe(res)
    return true
  } catch {
    return false
  }
}

/* ---------------- server ---------------- */

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? HOST}`)

  if (process.env.MEDIA_LOG === '1') {
    const started = Date.now()
    res.on('finish', () => {
      console.log(
        `[media] ${req.method} ${url.pathname} range=${req.headers.range ?? '-'} -> ${res.statusCode} (${Date.now() - started}ms)`,
      )
    })
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'hanya GET' })
    return
  }

  // Terima /api/... langsung, atau /media/api/... (dipakai build produksi
  // yang dilayani server ini sendiri, tanpa proxy Vite).
  const route = (url.pathname.replace(/^\/media/, '').replace(/\/+$/, '') || '/')

  if (route === '/api/library') {
    handleLibrary(res, url.searchParams.get('refresh') === '1').catch((err) => {
      console.error('[media] library gagal:', err)
      sendJson(res, 500, { error: String(err?.message ?? err) })
    })
    return
  }

  const streamMatch = /^\/stream\/([a-f0-9]{8,64})$/.exec(route)
  if (streamMatch) {
    handleStream(req, res, streamMatch[1]).catch((err) => {
      console.error('[media] stream gagal:', err)
      sendJson(res, 500, { error: String(err?.message ?? err) })
    })
    return
  }

  serveStatic(res, route)
    .then((served) => {
      if (!served) sendJson(res, 404, { error: 'rute tidak dikenal' })
    })
    .catch(() => sendJson(res, 404, { error: 'rute tidak dikenal' }))
})

server.listen(PORT, HOST, async () => {
  await ensureIndex(true).catch(() => {})
  console.log(`[media] root   : ${ROOT}`)
  console.log(`[media] alamat : http://${HOST}:${PORT}`)
  console.log(`[media] video  : ${index.size} file`)
})
