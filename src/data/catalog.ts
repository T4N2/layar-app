/* ============================================================
   Katalog demo.

   SEMUA JUDUL, SINOPSIS, DAN NAMA PEMAIN DI SINI FIKTIF.
   Dibuat hanya untuk mengisi UI. Tidak ada data yang diambil
   dari layanan mana pun.
   ============================================================ */

import type { Title } from '../types'
export const CATALOG: Title[] = [
  {
    id: 'ly-01',
    title: 'Langit Retak',
    year: 2024,
    rating: 8.4,
    duration: '2j 12m',
    type: 'film',
    genres: ['Sci-Fi', 'Drama'],
    synopsis:
      'Seorang teknisi satelit menemukan sinyal aneh yang ternyata pesan dari dirinya sendiri, lima tahun di masa depan. Setiap percobaan menjawabnya meretakkan satu bagian langit yang selama ini ia anggap nyata.',
    cast: ['Raka Nugraha', 'Sinta Maharani', 'Bagas Wicaksono'],
    colors: ['#3b1f6e', '#0f0c29'],
    tags: ['trending', 'popular', 'new'],
    featured: true,
  },
  {
    id: 'ly-02',
    title: 'Anjing Laut Terakhir',
    year: 2023,
    rating: 7.9,
    duration: '1j 48m',
    type: 'film',
    genres: ['Dokumenter', 'Petualangan'],
    synopsis:
      'Ekspedisi kecil di pesisir utara mengikuti seekor anjing laut yang bertahan di antara tambak yang mengering dan kota yang tumbuh ke arah laut.',
    cast: ['Nadia Prasetyo'],
    colors: ['#0b3b52', '#071a2b'],
    tags: ['popular'],
  },
  {
    id: 'ly-03',
    title: 'Kopi Pahit Bu Ratna',
    year: 2024,
    rating: 8.1,
    duration: '1j 56m',
    type: 'film',
    genres: ['Drama', 'Keluarga'],
    synopsis:
      'Warung kopi tua di sudut pasar jadi tempat rahasia keluarga terbongkar satu per satu, saat sang ibu memutuskan berhenti berjualan setelah tiga puluh tahun.',
    cast: ['Ratna Dewi', 'Yusuf Hidayat', 'Maya Sari'],
    colors: ['#5c2c0d', '#20120a'],
    tags: ['trending', 'popular'],
  },
  {
    id: 'ly-04',
    title: 'Garis Tengah',
    year: 2022,
    rating: 7.6,
    duration: '1j 39m',
    type: 'film',
    genres: ['Thriller', 'Olahraga'],
    synopsis:
      'Dua atlet satu kampung dipaksa memilih antara medali dan sahabat, ketika pelatih mereka menyusun satu kuota terakhir untuk kejuaraan nasional.',
    cast: ['Ilham Saputra', 'Doni Kurniawan'],
    colors: ['#1f4d2e', '#0a1d14'],
    tags: ['popular'],
  },
  {
    id: 'ly-05',
    title: 'Sirkuit Sunyi',
    year: 2025,
    rating: 8.7,
    duration: '2j 04m',
    type: 'film',
    genres: ['Aksi', 'Thriller'],
    synopsis:
      'Balapan ilegal di jalan pedesaan berubah jadi perburuan saat seorang pembalap membawa data yang tidak seharusnya ia lihat.',
    cast: ['Alvin Pratama', 'Kirana Ayu'],
    colors: ['#5e1220', '#170608'],
    tags: ['trending', 'new'],
  },
  {
    id: 'ly-06',
    title: 'Rumah Tanpa Jendela',
    year: 2023,
    rating: 8.0,
    duration: '1j 44m',
    type: 'film',
    genres: ['Horor', 'Misteri'],
    synopsis:
      'Sebuah keluarga pindah ke rumah murah yang tidak punya satu pun jendela. Semakin lama mereka tinggal, semakin sulit mengingat seperti apa cahaya matahari.',
    cast: ['Vina Lestari', 'Hendra Gunawan'],
    colors: ['#2a2340', '#0a0812'],
    tags: ['trending'],
  },
  {
    id: 'ly-07',
    title: 'Senja di Terminal 3',
    year: 2024,
    rating: 7.7,
    duration: '1j 52m',
    type: 'film',
    genres: ['Romansa', 'Drama'],
    synopsis:
      'Dua orang yang selalu salah pesawat bertemu di ruang tunggu yang sama, tiga kali dalam satu tahun, dan mulai menghitung kebetulan.',
    cast: ['Alya Ramadhani', 'Rio Firmansyah'],
    colors: ['#7a3b2e', '#241016'],
    tags: ['popular'],
  },
  {
    id: 'ly-08',
    title: 'Buku Merah Pak Slamet',
    year: 2022,
    rating: 8.3,
    duration: '2j 08m',
    type: 'film',
    genres: ['Drama', 'Sejarah'],
    synopsis:
      'Catatan utang seorang pedagang keliling tahun 60-an membuka kembali cerita satu kampung yang semua orang sudah sepakat untuk lupakan.',
    cast: ['Slamet Riyadi', 'Tuti Herawati'],
    colors: ['#4a3208', '#1a1204'],
    tags: ['popular'],
  },

  /* ---------------- SERIAL ---------------- */
  {
    id: 'sr-01',
    title: 'Nadi',
    year: 2025,
    rating: 8.9,
    duration: '8 episode',
    type: 'series',
    seasons: 1,
    genres: ['Medis', 'Drama'],
    synopsis:
      'Tim gawat darurat di rumah sakit pinggiran kota menghadapi malam terpanjang mereka, saat listrik padam dan pasien datang lebih cepat dari kemampuan mereka menolong.',
    cast: ['Bimo Aditya', 'Sari Kusuma', 'Laras Widya'],
    colors: ['#0f3d4a', '#06171f'],
    tags: ['trending', 'new', 'popular'],
  },
  {
    id: 'sr-02',
    title: 'Kode Kampung',
    year: 2024,
    rating: 8.2,
    duration: '10 episode',
    type: 'series',
    seasons: 2,
    genres: ['Komedi', 'Drama'],
    synopsis:
      'Sekelompok pemuda karang taruna nekat membangun aplikasi desa tanpa internet stabil, dan menemukan masalahnya bukan teknologinya.',
    cast: ['Fajar Ramadhan', 'Nia Salsabila'],
    colors: ['#1a3f6b', '#08182b'],
    tags: ['trending', 'popular'],
  },
  {
    id: 'sr-03',
    title: 'Perkara Waktu',
    year: 2023,
    rating: 8.5,
    duration: '6 episode',
    type: 'series',
    seasons: 1,
    genres: ['Misteri', 'Sci-Fi'],
    synopsis:
      'Setiap saksi dalam kasus lama mengingat kejadian yang sama dengan versi berbeda. Seorang jurnalis muda mencoba menyusun satu versi yang bisa dipertanggungjawabkan.',
    cast: ['Dewi Anggraini', 'Bayu Setiawan'],
    colors: ['#35205e', '#0d0819'],
    tags: ['popular', 'new'],
  },
  {
    id: 'sr-04',
    title: 'Tepi Kota',
    year: 2024,
    rating: 7.8,
    duration: '12 episode',
    type: 'series',
    seasons: 1,
    genres: ['Kriminal', 'Drama'],
    synopsis:
      'Seorang polisi yang baru dipindah ke perbatasan kota menangani kasus kecil yang ternyata menyambung ke jaringan besar.',
    cast: ['Rendi Saputra', 'Mega Puspita'],
    colors: ['#2b2b33', '#0c0c11'],
    tags: ['new'],
  },
  {
    id: 'sr-05',
    title: 'Dapur Ibu Mertua',
    year: 2025,
    rating: 7.5,
    duration: '9 episode',
    type: 'series',
    seasons: 1,
    genres: ['Komedi', 'Keluarga'],
    synopsis:
      'Menantu baru berusaha mempertahankan resep keluarganya sambil bertahan hidup di dapur yang punya aturan tidak tertulis.',
    cast: ['Rina Marlina', 'Adi Nugroho'],
    colors: ['#6b3a12', '#22120a'],
    tags: ['new'],
  },
  {
    id: 'sr-06',
    title: 'Frekuensi 88.8',
    year: 2023,
    rating: 8.4,
    duration: '7 episode',
    type: 'series',
    seasons: 1,
    genres: ['Thriller', 'Misteri'],
    synopsis:
      'Penyiar radio malam mulai menerima telepon dari nomor yang tidak terdaftar, membacakan kejadian yang belum terjadi.',
    cast: ['Galih Permana', 'Anisa Rahma'],
    colors: ['#4a0f2e', '#150510'],
    tags: ['popular'],
  },
  {
    id: 'sr-07',
    title: 'Sekolah di Ujung Rel',
    year: 2022,
    rating: 8.6,
    duration: '11 episode',
    type: 'series',
    seasons: 2,
    genres: ['Drama', 'Pendidikan'],
    synopsis:
      'Satu guru, sembilan murid, dan sekolah yang setiap tahun diancam ditutup karena kekurangan siswa.',
    cast: ['Pak Hendra', 'Bu Yati', 'Iqbal Maulana'],
    colors: ['#1d4d3f', '#081a15'],
    tags: ['popular'],
  },
  {
    id: 'sr-08',
    title: 'Batas Akhir',
    year: 2025,
    rating: 8.0,
    duration: '8 episode',
    type: 'series',
    seasons: 1,
    genres: ['Aksi', 'Kriminal'],
    synopsis:
      'Seorang negosiator sandera harus menyelamatkan diri sendiri saat tahu targetnya bukan orang asing.',
    cast: ['Yoga Pratama', 'Chelsea Anjani'],
    colors: ['#5c1a1a', '#190707'],
    tags: ['trending', 'new'],
  },
]

/**
 * Katalog demo tidak punya file video — `media` sengaja dibiarkan kosong,
 * jadi <Player> menampilkan placeholder. Baris beranda disusun di
 * src/lib/library.ts (buildRows).
 */
export const DEMO_SOURCE_LABEL = 'katalog demo'
