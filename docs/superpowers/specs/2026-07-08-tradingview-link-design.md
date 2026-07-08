# Link Profil TradingView untuk Pembeli Indikator

## Latar belakang

Admin perlu tahu link profil TradingView setiap pembeli indikator, supaya bisa mendaftarkan mereka ke invite-only Pine Script di TradingView. Sekarang belum ada cara member submit link ini lewat website — harus diminta manual via WA/japri.

## Solusi

### 1. Data

Kolom baru `members.tradingview_url` (text, nullable). Satu link per member (bukan per pesanan) — realistis karena satu orang biasanya cuma punya satu akun TradingView, dan supaya sinkron dimanapun mereka isi/ubah.

### 2. UI member — dua lokasi, field yang sama

Keduanya baca/tulis `member.tradingview_url` via `supabase.from('members').update({ tradingview_url }).eq('id', member.id)`. Kalau kosong: tombol "Hubungkan TradingView" yang membuka input teks + tombol Simpan. Kalau sudah terisi: tampil "✓ Terhubung: {link}" (elemen `<a>` target _blank) dengan cara untuk mengubahnya (klik lagi untuk buka input, prefill dengan nilai sekarang).

- **`member/DashboardPage.tsx`, tab `dashboard` (home ringkas member indikator)**: tombol ketiga, setelah tombol "Beli/Perpanjang Indikator" dan "Hubungkan via Discord OAuth" (blok yang sama yang dibuat di fitur dashboard-indikator-member sebelumnya).
- **`member/DashboardPage.tsx`, tab `produk` → view `pesanan` ("Pesanan Saya")**: satu kotak yang sama di bagian atas list pesanan (sebelum daftar pesanan di-render) — **bukan** diulang per kartu pesanan, karena ini bukan field per-pesanan. Ini yang membuat member kelas yang beli indikator via `buatOrder()` (tidak pernah melihat tab dashboard home versi ringkas) tetap bisa mengisi link mereka.

### 3. Tampilan di admin

Di `AdminPage.tsx`, tab Produk → "Pesanan Masuk": tiap baris pesanan indikator (yang sudah menampilkan email/no HP dari fitur sebelumnya) menambahkan satu baris lagi menampilkan link TradingView member itu — **read-only**, elemen `<a>` kalau ada isinya, teks "— belum diisi" kalau kosong. Diambil dari state `members` yang sudah ada di file ini (`const [members, setMembers] = useState<Member[]>([])`, sudah `select('*')` jadi otomatis membawa kolom baru tanpa ubah query), dicocokkan lewat `members.find(m => m.id === order.member_id)`.

## Di luar cakupan

- Tidak ada validasi format URL — cukup input teks biasa, disimpan apa adanya (konsisten dengan field sederhana lain di codebase ini seperti `no_hp`/`email`).
- Tidak ditambahkan ke tab Member Management terpisah — cukup di baris Pesanan Masuk.
- Tidak menyimpan riwayat perubahan link (kalau member ganti link, yang lama hilang, tidak ada log).
