/** Gradien poster dari dua warna judul. */
export function posterGradient(colors: readonly [string, string]): string {
  return `linear-gradient(150deg, ${colors[0]} 0%, ${colors[1]} 100%)`
}

/** Palet untuk judul yang tidak punya warna sendiri (mis. file lokal). */
const PALETTE: readonly (readonly [string, string])[] = [
  ['#3b1f6e', '#0f0c29'],
  ['#0b3b52', '#071a2b'],
  ['#5c2c0d', '#20120a'],
  ['#1f4d2e', '#0a1d14'],
  ['#5e1220', '#170608'],
  ['#2a2340', '#0a0812'],
  ['#0f3d4a', '#06171f'],
  ['#4a0f2e', '#150510'],
  ['#1a3f6b', '#08182b'],
  ['#6b3a12', '#22120a'],
]

/** Warna stabil dari sebuah id: id sama selalu dapat warna sama. */
export function paletteFor(seed: string): [string, string] {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  const pair = PALETTE[h % PALETTE.length]
  return [pair[0], pair[1]]
}
