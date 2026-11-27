// lib/panduan.ts — Isi halaman /panduan (Pusat Panduan). Sumber: dokumen "Panduan Pengguna Menolak Rugi".
// Ubah teks di sini bila alur website berubah; halaman PanduanPage hanya menampilkan data ini.

export type BlokPanduan =
  | { jenis: 'teks'; isi: string }
  | { jenis: 'langkah'; judul?: string; isi: string[] }
  | { jenis: 'poin'; judul?: string; isi: string[] }
  | { jenis: 'tabel'; kolom: string[]; baris: string[][] }
  | { jenis: 'tips' | 'awas'; isi: string };

export interface TopikPanduan {
  id: string;
  grup: GrupPanduan;
  judul: string;
  ringkas: string;
  blok: BlokPanduan[];
}

export type GrupPanduan = 'akun' | 'kelas' | 'indikator' | 'fitur';

export const GRUP: { id: GrupPanduan; nama: string; ket: string }[] = [
  { id: 'akun', nama: 'Akun', ket: 'Login, password, Discord' },
  { id: 'kelas', nama: 'Kelas', ket: 'Beli, upgrade, naik Advanced' },
  { id: 'indikator', nama: 'Indikator', ket: 'Beli, pasang, klaim v5' },
  { id: 'fitur', nama: 'Fitur Member', ket: '1-on-1, jurnal, kompetisi' },
];

export const TOPIK: TopikPanduan[] = [
  {
    id: 'login', grup: 'akun', judul: 'Login & lupa password',
    ringkas: 'Masuk dengan nama, tier, dan password. Lupa password? Reset lewat admin.',
    blok: [
      { jenis: 'langkah', judul: 'Cara login', isi: [
        'Buka menolakrugi.com/login.',
        'Isi Nama Lengkap persis seperti saat mendaftar.',
        'Pilih Tier Kelas: SMC Trial, Bronze, Silver, Gold Mentorship, Platinum 1-on-1, atau Indikator Bulanan / Tahunan / Lifetime untuk pembeli indikator.',
        'Isi Password. Centang "Ingat saya di perangkat ini" bila memakai perangkat pribadi.',
        'Klik Masuk ke Trading Room.',
      ] },
      { jenis: 'awas', isi: 'Akun baru belum bisa login sebelum admin memverifikasi pembayaran.' },
      { jenis: 'langkah', judul: 'Lupa password', isi: [
        'Di halaman login, klik Lupa Password?.',
        'Isi nama lengkap dan tier kelas. WhatsApp admin terbuka dengan pesan permintaan reset.',
        'Kirim pesan itu dari nomor WhatsApp yang kamu pakai saat membeli.',
        'Admin mencocokkan data akun dan mengirim password baru lewat WhatsApp.',
        'Login dengan password baru, lalu ganti di Pengaturan → Ganti Password.',
      ] },
    ],
  },
  {
    id: 'discord', grup: 'akun', judul: 'Discord & status trading',
    ringkas: 'Hubungkan Discord supaya role server terpasang otomatis sesuai tier.',
    blok: [
      { jenis: 'langkah', judul: 'Hubungkan Discord', isi: [
        'Buka menu Pengaturan di dashboard.',
        'Klik Hubungkan via Discord OAuth, login ke Discord, lalu izinkan akses.',
        'Kamu kembali ke website dan role server otomatis diset sesuai tier.',
      ] },
      { jenis: 'tips', isi: 'Bisa juga isi username Discord manual, tapi role tidak terpasang otomatis; admin yang memprosesnya.' },
      { jenis: 'poin', judul: 'Status trading (menu Status Trading)', isi: [
        'Sedang trading di akun demo',
        'Challenge phase pertama',
        'Challenge phase kedua',
        'Berhasil withdrawal pertama',
        'Trading dengan akun sendiri',
      ] },
      { jenis: 'teks', isi: 'Status yang kamu pilih ikut mengubah nickname Discord bila akun sudah terhubung.' },
    ],
  },
  {
    id: 'beli-kelas', grup: 'kelas', judul: 'Membeli kelas',
    ringkas: 'Buat akun sekaligus pesan kelas, bayar, lalu tunggu verifikasi admin.',
    blok: [
      { jenis: 'tabel', kolom: ['Kelas', 'Harga', 'Isi utama'], baris: [
        ['SMC Trial', 'Rp99.000/bulan', 'Materi dasar, outlook harian, live komunitas'],
        ['SMC Bronze', 'Rp500.000 sekali bayar', 'Materi SMC lengkap, akses seumur hidup'],
        ['SMC Gold Mentorship', 'Rp1.000.000 sekali bayar', 'Isi Bronze + 2× live mentoring/minggu, 1-on-1'],
        ['SMC Platinum 1-on-1', 'Rp3.500.000 sekali bayar', 'Isi Gold + sesi privat, kurikulum personal'],
      ] },
      { jenis: 'tips', isi: 'Selama event promo (mis. Black Friday), harga promo otomatis tampil di semua halaman.' },
      { jenis: 'langkah', judul: 'Langkah', isi: [
        'Buka menolakrugi.com/pricing-kelas lalu klik Pilih [kelas].',
        'Isi Nama Lengkap (sesuai KTP), Email, dan Password (minimal 8 karakter).',
        'Klik daftar; kamu diarahkan ke halaman pembayaran.',
        'Pilih transfer bank atau QRIS. Punya kode kupon? Isi di kolomnya.',
        'Transfer sesuai Total Transfer, lalu klik Konfirmasi via WhatsApp dan kirim bukti transfer.',
        'Setelah diverifikasi admin, login dengan nama, tier, dan password yang kamu buat.',
      ] },
    ],
  },
  {
    id: 'upgrade-kelas', grup: 'kelas', judul: 'Upgrade & aktifkan lagi kelas',
    ringkas: 'Naik kelas dari dashboard dan cukup bayar selisihnya.',
    blok: [
      { jenis: 'teks', isi: 'Harga upgrade = harga kelas baru dikurangi harga yang dulu kamu bayar untuk kelas lama. Trial (langganan bulanan) tidak mendapat potongan.' },
      { jenis: 'tabel', kolom: ['Upgrade', 'Harga kelas baru', 'Potongan', 'Dibayar'], baris: [
        ['Bronze → Gold', 'Rp1.000.000', 'Rp500.000', 'Rp500.000'],
        ['Bronze → Platinum', 'Rp3.500.000', 'Rp500.000', 'Rp3.000.000'],
        ['Gold → Platinum', 'Rp3.500.000', 'Rp1.000.000', 'Rp2.500.000'],
        ['Trial → Gold', 'Rp1.000.000', '–', 'Rp1.000.000'],
      ] },
      { jenis: 'langkah', judul: 'Langkah upgrade', isi: [
        'Login, lalu klik NAIK TIER di kartu membership (atau UPGRADE KE GOLD di menu 1-on-1 Mentoring).',
        'Pilih kelas tujuan; potongan dan total bayar langsung terlihat.',
        'Klik Upgrade ke [kelas]. Pesanan dibuat atas akunmu yang sama.',
        'Transfer sesuai Total Transfer, lalu kirim bukti lewat Konfirmasi via WhatsApp.',
        'Setelah admin mengaktifkan pesanan, tier kamu naik otomatis. Logout lalu login lagi dengan tier baru.',
      ] },
      { jenis: 'awas', isi: 'Kode kupon tidak berlaku untuk upgrade. Akses bulanan habis? Klik AKTIFKAN LAGI; kelas yang sama bisa dipilih dengan harga penuh.' },
    ],
  },
  {
    id: 'advanced', grup: 'kelas', judul: 'Naik kelas Advanced & sertifikat',
    ringkas: 'Ajukan dengan jurnal trading; setelah disetujui materi Advanced dan sertifikat terbuka.',
    blok: [
      { jenis: 'langkah', isi: [
        'Buka menu Kelas Saya. Video Advanced tampil terkunci ("Butuh Advanced").',
        'Klik Ajukan Naik Kelas.',
        'Lampirkan jurnal trading: tempel link atau unggah file PDF/gambar.',
        'Kirim; status menjadi "Request sedang direview admin".',
        'Bila ditolak, perbaiki jurnal lalu klik Ajukan Ulang.',
      ] },
      { jenis: 'tips', isi: 'Setelah naik kelas Advanced, unduh sertifikat atas namamu di menu Sertifikat.' },
    ],
  },
  {
    id: 'beli-indikator', grup: 'indikator', judul: 'Membeli indikator',
    ringkas: 'Beli tanpa akun (akun dibuatkan otomatis) atau dari dashboard member.',
    blok: [
      { jenis: 'tabel', kolom: ['Produk', 'Paket', 'Harga normal', 'Akun TradingView'], baris: [
        ['SMC v5', 'Lifetime', 'Rp3.000.000', 'Akun gratis pun bisa'],
        ['SMC v4.2', 'Bulanan / Tahunan / Lifetime', 'Rp200.000 / Rp2.000.000 / Rp3.000.000', 'Wajib minimal Essential'],
      ] },
      { jenis: 'teks', isi: 'v5 khusus XAUUSD M5 dengan label entry otomatis; v4.2 bebas pair & timeframe dengan analisa manual. Data backtest v5 ada di menolakrugi.com/backtest-indikator.' },
      { jenis: 'langkah', judul: 'Pembeli baru (belum punya akun)', isi: [
        'Buka menolakrugi.com/pricing-indikator, pilih produk dan paket.',
        'Isi Nama Lengkap, Email, dan No. WhatsApp. Punya kode diskon? Isi di kolomnya.',
        'Pilih transfer bank atau QRIS, lalu kirim pesanan.',
        'Simpan nama login dan password yang tampil di halaman berikutnya.',
        'Transfer, lalu klik konfirmasi WhatsApp dan kirim bukti transfer.',
        'Admin mengaktifkan akun dan mengirim link indikator lewat WhatsApp.',
      ] },
      { jenis: 'langkah', judul: 'Sudah punya akun', isi: [
        'Login, buka menu Produk, pilih produk dan paket.',
        'Cek pesanan, isi kode diskon bila ada, lalu Lanjutkan ke Pembayaran.',
        'Transfer sesuai nominal dan kirim bukti ke admin lewat WhatsApp.',
        'Status pesanan berubah dari Pending ke Aktif setelah diverifikasi.',
      ] },
    ],
  },
  {
    id: 'pasang-indikator', grup: 'indikator', judul: 'Memasang indikator di TradingView',
    ringkas: 'Admin membuka akses untuk akun TradingView kamu, lalu tambahkan ke chart.',
    blok: [
      { jenis: 'langkah', isi: [
        'Pembeli baru: buat akun TradingView baru lewat link dari admin.',
        'Pastikan paket TradingView sesuai: v4.2 wajib minimal Essential, v5 bisa akun gratis.',
        'Simpan link profil TradingView di dashboard: menu Produk → Link Profil TradingView.',
        'Setelah pesanan aktif, admin mengirim link script dan video cara setting lewat WhatsApp.',
        'Buka link script saat login di akun TradingView yang sama, tambahkan ke favorit, lalu pilih dari menu Indikator → Favorit di chart.',
        'Atur setting mengikuti video dari admin.',
      ] },
      { jenis: 'awas', isi: 'Muncul error di v4.2? Itu karena kebijakan batas waktu indikator dari TradingView; upgrade akun ke minimal paket Essential.' },
    ],
  },
  {
    id: 'klaim-v5', grup: 'indikator', judul: 'Klaim v5 gratis',
    ringkas: 'Khusus pemilik v4.2 Lifetime yang dibeli sebelum 20 November 2026 — member kelas mentoring tanpa batas tanggal.',
    blok: [
      { jenis: 'poin', judul: 'Syarat', isi: [
        'Punya indikator SMC v4.2 dengan status aktif.',
        'Dibeli sebelum v5 rilis (20 November 2026). Khusus member kelas mentoring (Bronze/Gold/Platinum): kapan pun dibeli tetap bisa klaim.',
        'Paket Lifetime. Paket Bulanan/Tahunan tidak termasuk.',
        'Belum punya SMC v5.',
      ] },
      { jenis: 'langkah', judul: 'Cara klaim', isi: [
        'Login, buka menu Produk, lalu klik Klaim v5 Gratis.',
        'Bila memenuhi syarat, WhatsApp admin terbuka dengan pesan klaim; kirim pesannya.',
        'Admin memverifikasi dan mengirim link v5 lewat WhatsApp.',
      ] },
      { jenis: 'tips', isi: 'Tidak memenuhi syarat? v5 Lifetime tetap bisa dibeli; cek harga promo di halaman Black Friday selama event.' },
    ],
  },
  {
    id: 'mentoring', grup: 'fitur', judul: '1-on-1 Mentoring',
    ringkas: 'Sesi privat dengan mentor untuk member Gold dan Platinum.',
    blok: [
      { jenis: 'langkah', isi: [
        'Login, buka menu 1-on-1 Mentoring.',
        'Isi Nickname Discord dan topik yang ingin dibahas sejelas mungkin.',
        'Kirim request; statusnya tampil di Riwayat Request.',
        'Admin menyetujui dengan jadwal sesi atau menolak dengan alasan. Kamu mendapat notifikasi di dashboard.',
        'Siapkan pertanyaanmu; admin menghubungi lewat Discord sesuai jadwal.',
      ] },
      { jenis: 'awas', isi: 'Trial dan Bronze melihat menu ini terkunci. Selama masih ada request pending, request baru belum bisa diajukan.' },
    ],
  },
  {
    id: 'jurnal', grup: 'fitur', judul: 'Jurnal, peringkat & kompetisi',
    ringkas: 'Trade yang kamu catat otomatis dihitung untuk peringkat dan kompetisi.',
    blok: [
      { jenis: 'langkah', judul: 'Mencatat trade', isi: [
        'Buka menu Jurnal Trading.',
        'Sekali di awal, isi Equity Awal ($), target harian, batas rugi harian, dan target bulanan.',
        'Tambah trade: tanggal, pair, hasil, RR, PnL, setup, alasan entry, link chart, catatan.',
        'Saring per pair atau hasil, dan unduh lewat Download Excel.',
      ] },
      { jenis: 'poin', judul: 'Peringkat & kompetisi', isi: [
        'Tidak ada pendaftaran: mengisi jurnal = ikut kompetisi yang sedang berjalan.',
        'Skor = total PnL selama periode lomba ÷ Equity Awal × 100%.',
        'Equity Awal yang belum diisi dihitung $10.000, jadi isi dengan benar.',
        'Trade dihitung menang bila hasilnya Take Profit atau SL Profit.',
      ] },
    ],
  },
  {
    id: 'lainnya', grup: 'fitur', judul: 'Ulasan, referral & promo',
    ringkas: 'Bagikan ulasan, ajak teman, dan manfaatkan promo.',
    blok: [
      { jenis: 'langkah', judul: 'Tulis ulasan', isi: [
        'Buka menu Tulis Ulasan, pilih bintang, dan ceritakan pengalamanmu.',
        'Ulasan yang disetujui admin tampil di halaman utama.',
      ] },
      { jenis: 'langkah', judul: 'Referral', isi: [
        'Buka menu Referral dan salin link referral kamu.',
        'Bagikan lewat Share WhatsApp atau Share Telegram.',
        'Teman yang mendaftar lewat link itu tercatat di Daftar Referral.',
      ] },
      { jenis: 'poin', judul: 'Promo & kode diskon', isi: [
        'Saat ada event, halaman menolakrugi.com/black-friday memuat semua penawaran dan hitung mundurnya.',
        'Kode diskon tidak ditumpuk dengan promo: yang dipakai diskon terbesar.',
        'Kode tidak berlaku untuk upgrade kelas.',
        'Harga promo berlaku untuk pembayaran selama periode event.',
      ] },
    ],
  },
];

/** Topik yang cocok dengan kata kunci (judul, ringkasan, dan isi blok). */
export function cariTopik(topik: TopikPanduan[], q: string): TopikPanduan[] {
  const k = q.trim().toLowerCase();
  if (!k) return topik;
  return topik.filter((t) => {
    const teks = [t.judul, t.ringkas, ...t.blok.flatMap((b) =>
      b.jenis === 'tabel' ? [...b.kolom, ...b.baris.flat()] : 'judul' in b && b.judul ? [b.judul, ...([] as string[]).concat(b.isi)] : ([] as string[]).concat(b.isi),
    )].join(' ').toLowerCase();
    return k.split(/\s+/).every((w) => teks.includes(w));
  });
}
