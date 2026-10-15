# LAYAR — Media player web (React + TypeScript + Vite)

Antarmuka aplikasi streaming **yang benar-benar bisa memutar video**. Katalog,
poster, detail, player, pencarian, dan Daftar Saya — plus dua jalur sumber:
folder lokal dan server online.

## Arsitektur: satu kontrak, dua backend

```
                    ┌─────────────────────────┐
   frontend  ──────►│  MediaSource (kontrak)  │
   (React)          │  list(): MediaItem[]    │
                    └───────────┬─────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
        localApi.ts                    remoteApi.ts
        base: /media                   base: VITE_REMOTE_API
        server/media-server.mjs        server kamu sendiri
        (baca folder di laptop)        (kontrak sama persis)
```

Frontend tidak tahu bedanya. Selama balikannya `MediaItem[]`, UI dan player
jalan tanpa perubahan satu baris pun.

Kontraknya (`src/lib/sources/types.ts`):

```ts
GET <base>/api/library
→ { root, count, items: [{ id, title, folder, relPath, ext,
                           sizeBytes, modified, streamUrl }] }
```

Sumber dicoba berurutan: **lokal dulu**, lalu **online**. Kalau dua-duanya mati,
baru jatuh ke katalog demo (yang tidak punya file, jadi player menampilkan
placeholder).

## Jalanin

```bash
pnpm install
pnpm dev:all        # server media + Vite sekaligus → http://localhost:5173
```

Atau dua terminal kalau mau lihat log terpisah:

```bash
pnpm media          # server media  → http://127.0.0.1:5179
pnpm dev            # Vite          → http://localhost:5173
```

Folder yang dibaca bisa diganti:

```bash
MEDIA_ROOT="D:/Film/Video" pnpm media
```

Perintah lain: `pnpm build`, `pnpm preview`, `pnpm lint`.

## Struktur

```
index.html                        + meta CSP
vite.config.ts                    proxy /media -> server media
server/
  media-server.mjs                scan folder + streaming Range + sajikan dist
scripts/
  dev-all.mjs                     jalankan dua server sekaligus
src/
  App.tsx                         state halaman + perakitan
  types.ts                        Title, MediaBacking, ResolvedStream
  index.css                       token warna, reset
  styles/app.css                  gaya komponen
  data/catalog.ts                 katalog demo (semua fiktif, tanpa file)
  hooks/useLibrary.ts             muat pustaka dari sumber
  lib/
    sources/
      types.ts                    KONTRAK MediaItem / MediaSource
      localApi.ts                 backend lokal
      remoteApi.ts                backend online
      index.ts                    pilih sumber yang tersedia
    library.ts                    MediaItem -> Title, susun baris beranda
    stream.ts                     titik sambung ke <video>   <-- inti
    store.ts                      localStorage (validasi + fallback memori)
    format.ts                     format waktu & ukuran
    art.ts                        gradien poster
  context/                        toast + watchlist
  components/                     Header, Hero, Row, Card, DetailModal,
                                  Player, ErrorBoundary, Icons
```

## Server media lokal

Dua rute saja:

| Rute | Guna |
| --- | --- |
| `GET /api/library` | daftar file video di `MEDIA_ROOT` |
| `GET /stream/<id>` | isi file, dukung HTTP Range (wajib untuk seek) |

Keputusan keamanan yang sengaja diambil:

- **Bind ke `127.0.0.1` saja**, tidak ke `0.0.0.0`.
- **Tidak ada header CORS.** Tanpa itu, situs lain yang kamu buka di browser
  tidak bisa membaca isi folder ini lewat `localhost`. Akses hanya lewat proxy
  Vite (same-origin).
- **URL stream memakai id hasil hash, bukan path.** Tidak ada masukan pengguna
  yang masuk ke sistem file.
- **Lapis kedua di `/stream/<id>`**: `realpath` file dicek lagi harus berada di
  dalam `MEDIA_ROOT` (jaga-jaga symlink).

## Titik sambung sumber video

Semuanya di satu fungsi: `src/lib/stream.ts`.

```ts
export function resolveStream(item) {
  if (item.media?.streamUrl) return { kind: 'file', src: item.media.streamUrl }
  return null   // -> player menampilkan placeholder
}
```

Player bercabang otomatis: `null` → placeholder, ada `src` → elemen `<video>`
sungguhan dengan event `loadedmetadata` / `timeupdate` / `ended` tersambung.
Mau HLS? Cukup tambah cabang di sini, komponen tidak perlu disentuh.

## Fitur

Pemutar:
- play/pause, ±10 detik, seek klik, volume, mute, layar penuh
- kecepatan putar 0,5×–2×, picture-in-picture, subtitle (tombol CC)
- buffered bar + spinner saat buffering
- kontrol auto-hide saat idle
- HLS (`.m3u8`) lewat hls.js, dimuat malas

Keyboard: `Spasi`/`k` putar-jeda · `←`/`j` mundur 10 detik · `→`/`l` maju
10 detik · `f` layar penuh · `m` bisu · `i` picture-in-picture · `Esc` tutup

Katalog:
- beranda dengan hero sorotan dan baris per folder
- pencarian: judul, genre, pemain, tahun, path file
- Daftar Saya dan Lanjutkan Tonton (tersimpan di localStorage)

## Yang sudah diuji

Dijalankan di browser sungguhan, bukan sekadar ditulis:

- `tsc -b` bersih, `oxlint` 0 warning, `vite build` sukses (41 modul)
- Katalog termuat dari folder lokal: 10 file dari `D:/Film/Video`
- **Pemutaran nyata**: video termuat, durasi dibaca dari file
  (15,02 detik dan 508,24 detik / 8:28 pada file 63 MB)
- **Seek**: klik di 80% → `currentTime` lompat ke ~13 detik, bar ikut menyesuaikan
- **±10 detik**: mundur dari 13,26 → ~4 detik, label ikut berubah
- **Buffered bar**: saat memutar file 63 MB, bar buffer mendahului posisi putar
  (7,2% vs 0,67%)
- **Kecepatan putar**: menu 6 opsi (0,5×–2×), pilih 1,5× → `playbackRate` jadi 1,5
  dan label muncul di kontrol
- **Progres tersimpan**: keluar player → baris "Lanjutkan Tonton" muncul
- **HTTP Range** di server: `206 Partial Content` + `Content-Range` benar,
  suffix range (`bytes=-50`) benar, id ngawur → `404`
- **Path traversal diblokir**: `../../etc/passwd`, `%2e%2e/`, dsb. semuanya
  hanya mengembalikan `index.html`, tidak pernah isi file
- Daftar Saya, pencarian, modal detail, navigasi — semua jalan
- **Picture-in-picture**: diuji dengan klik dan tombol keyboard asli (event
  input CDP, bukan klik skrip) — masuk PiP berhasil
  (`document.pictureInPictureElement` = VIDEO), tombol jadi `is-active` +
  `aria-pressed="true"`, klik ulang keluar PiP, dan menutup player saat masih
  di PiP otomatis menutup jendela mengambangnya
- **Shortcut keyboard**: `i` masuk/keluar PiP — terverifikasi lewat event
  keyboard CDP

### Catatan kejujuran

Pemutaran di atas diverifikasi pada **mode dev** (Vite + proxy). Untuk mode
produksi, halaman, aset, API pustaka, dan chunk Player semuanya terverifikasi
termuat, dan rute streaming-nya terverifikasi lewat HTTP (206 + Range benar).
Yang **belum** bisa saya verifikasi ulang di browser adalah elemen `<video>`
saat produksi: di tengah pengujian, browser harness di mesin ini kehilangan
kemampuan memuat media sama sekali — video publik dari internet pun `stalled`,
termasuk dari server Python polos dan di sesi browser baru. Jadi itu masalah
lingkungan pengujian, bukan kode. Di browser normal kamu, mode produksi
memakai kode dan rute yang sama persis dengan yang sudah terbukti jalan.

## Catatan keamanan produksi

- Meta CSP sudah aktif dan tidak memblokir aplikasi (diuji).
- Untuk produksi sungguhan: pindahkan CSP ke response header (meta tidak
  mendukung `frame-ancestors`) dan buang `'unsafe-inline'` dari `script-src` —
  Vite dev butuh itu, build produksi tidak.
- Jalur `remoteApi` sengaja **tidak** saya isi base URL-nya. Isi
  `VITE_REMOTE_API` kalau server online-nya sudah ada, dan pastikan server itu
  kamu sendiri yang kelola.

## Ukuran bundle (produksi)

```
dist/index.html                 1,23 kB │ gzip   0,59 kB
dist/assets/index-*.css        19,93 kB │ gzip   5,23 kB
dist/assets/Player-*.js         9,06 kB │ gzip   3,22 kB   <- lazy, saat diputar
dist/assets/index-*.js        248,38 kB │ gzip  77,88 kB
dist/assets/hls-*.js          574,41 kB │ gzip 178,97 kB   <- lazy, hanya untuk .m3u8
```

`hls.js` tidak ikut bundle awal. Baru diunduh saat ada stream `.m3u8` yang
diputar, jadi pemutaran file biasa tidak terbebani.

## Langkah berikutnya

- Isi `VITE_REMOTE_API` untuk jalur online.
- Tambahkan subtitle WebVTT ke `ResolvedStream.subtitles` supaya tombol CC aktif.
- Bungkus jadi desktop/APK: Tauri (desktop) atau Capacitor (Android).
