/* ============================================================
   Penyimpanan lokal kecil: Daftar Saya + progres tonton.

   Semua baca-tulis dibungkus try/catch dan divalidasi bentuknya,
   karena localStorage bisa diblokir (mode privat, file://) dan
   isinya bisa saja sudah diubah tangan.
   ============================================================ */

const KEY_LIST = 'layar.mylist'
const KEY_PROGRESS = 'layar.progress'

const memory = new Map<string, string>()

let persistent = true
try {
  const probe = '__layar_probe__'
  window.localStorage.setItem(probe, '1')
  window.localStorage.removeItem(probe)
} catch {
  persistent = false
}

export function isPersistent(): boolean {
  return persistent
}

function readRaw(key: string): string | null {
  try {
    if (persistent) return window.localStorage.getItem(key)
  } catch {
    /* jatuh ke memori */
  }
  return memory.get(key) ?? null
}

function writeRaw(key: string, value: string): void {
  memory.set(key, value)
  if (!persistent) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* memori sudah menyimpan salinannya */
  }
}

export function readList(): string[] {
  const raw = readRaw(KEY_LIST)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

export function writeList(ids: readonly string[]): void {
  writeRaw(KEY_LIST, JSON.stringify(ids))
}

export type ProgressMap = Record<string, number>

export function readProgress(): ProgressMap {
  const raw = readRaw(KEY_PROGRESS)
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: ProgressMap = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        out[k] = Math.min(1, Math.max(0, v))
      }
    }
    return out
  } catch {
    return {}
  }
}

export function writeProgress(map: ProgressMap): void {
  writeRaw(KEY_PROGRESS, JSON.stringify(map))
}

export function saveProgress(id: string, ratio: number): void {
  if (!Number.isFinite(ratio) || ratio <= 0) return
  const map = readProgress()
  map[id] = Math.min(1, Math.max(0, ratio))
  writeProgress(map)
}
