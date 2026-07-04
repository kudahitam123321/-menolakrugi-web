# Design: Buat Akun Member Otomatis di Alur /bayar

Date: 2026-07-04

## Overview

Saat ini, visitor yang beli indikator lewat `/bayar` (dari CTA landing page) mengisi form (nama, email, no HP), pilih metode pembayaran, lalu klik "KONFIRMASI VIA WHATSAPP" — yang cuma insert baris ke `orders` (`member_id: 'guest'`) dan langsung buka WhatsApp. Pembeli tidak pernah dapat akun untuk login ke dashboard member.

Perubahan: tombol itu diganti jadi "LANJUTKAN & KONFIRMASI PEMBAYARAN", yang (selain insert order) juga membuat akun `members` baru untuk pembeli, lalu mengarahkan ke halaman baru `/bayar/akun` yang menampilkan username + password akun tersebut, dengan tombol "Konfirmasi via WhatsApp" di halaman itu untuk memberi tahu admin supaya verifikasi pembayaran & aktifkan akunnya.

---

## 1. Alur Lengkap

```
/bayar
  → isi Nama, Email, No. WhatsApp
  → pilih metode pembayaran (bank/QRIS, sudah ada)
  → klik "LANJUTKAN & KONFIRMASI PEMBAYARAN"
      → cek nama sudah terdaftar di `members`? (case-insensitive)
          → YA: tampilkan error inline, STOP (tidak insert apa pun)
          → TIDAK: insert `members` baru (tier: 'SMC Trial', password random,
            is_active: false, role: 'member'), lalu insert `orders` dengan
            member_id = id member baru
      → redirect ke /bayar/akun?order=<id order>

/bayar/akun?order=<id>
  → fetch order by id → ambil member_id, nama_member, email_member, plan_type,
    diskon_applied, catatan
  → fetch member by member_id → ambil nama, password
  → tampilkan:
      - status sukses "Akun kamu sudah dibuat!"
      - Username: {member.nama}   [tombol salin]
      - Password: {member.password}   [tombol salin]
      - Tier: SMC Trial
      - catatan: "Simpan info ini baik-baik. Login baru bisa dipakai setelah
        admin verifikasi pembayaran kamu."
      - tombol "Konfirmasi via WhatsApp" → buka wa.me dengan pesan (nama,
        plan, metode pembayaran dari catatan order, order id, + kalimat minta
        admin verifikasi & aktifkan akun)
      - link sekunder "Ke Halaman Login →" (arah /login)
  → kalau param `order` kosong/invalid atau fetch gagal: tampilan error
    sederhana + tombol kembali ke /bayar

(sisi admin, tidak ada perubahan UI baru)
  → Admin Panel → Produk → Pesanan Masuk: admin lihat order baru, ubah status
    ke "dibayar"/"aktif" (fitur existing), atau hapus (tombol HAPUS yang baru
    ditambahkan)
  → Admin Panel → Member: admin klik badge is_active pada baris member baru
    untuk mengaktifkan (fitur existing, `toggleActive` di komponen tab
    Member)
  → Member login di /login pakai Nama + tier "SMC Trial" + Password yang
    ditampilkan di /bayar/akun
```

---

## 2. Perubahan `src/pages/BayarPage.tsx`

### Fungsi baru: `generateMemberPassword()`

Duplikat pola `generatePassword()` yang sudah ada di `AdminPage.tsx` (module-level, tidak diimpor — konsisten dengan pola copy-paste di codebase ini):

```ts
function generateMemberPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
```

### `handleSubmit` — logic baru

Sebelum insert order (setelah validasi form yang sudah ada — nama/email/noHp/metode/plan wajib), tambah:

1. Cek existing member dengan nama sama (case-insensitive, pola identik dengan `SignupPage.tsx`):
   ```ts
   const { data: existing } = await supabase
     .from('members').select('id').ilike('nama', nama.trim()).single();
   if (existing) {
     setErrMsg('Nama sudah terdaftar. Silakan login atau hubungi admin jika ini akun kamu.');
     return;
   }
   ```
2. Insert member baru:
   ```ts
   const memberPassword = generateMemberPassword();
   const { data: newMember, error: memberErr } = await supabase.from('members').insert({
     nama: nama.trim(),
     tier: 'SMC Trial',
     password: memberPassword,
     role: 'member',
     is_active: false,
     is_advance: false,
   }).select('id').single();
   if (memberErr || !newMember) { setErrMsg('Gagal membuat akun: ' + (memberErr?.message || 'unknown error')); return; }
   ```
3. Insert order dengan `member_id: newMember.id` dan `tier_member: 'SMC Trial'` (bukan `'guest'`/`'visitor'` seperti sekarang), lalu `.select('id').single()` supaya dapat order id untuk redirect:
   ```ts
   const { data: newOrder, error } = await supabase.from('orders').insert({
     member_id:      newMember.id,
     tier_member:    'SMC Trial',
     nama_member:    nama.trim(),
     email_member:   email.trim(),
     catatan:        `WA: ${noHp.trim()} | ${metodeInfo}`,
     plan_type:      plan.key,
     diskon_applied: plan.diskon || null,
     status:         'pending',
   }).select('id').single();
   if (error || !newOrder) { setErrMsg('Gagal menyimpan pesanan: ' + (error?.message || 'unknown error')); return; }
   ```
4. Redirect (ganti logic buka WA yang sekarang):
   ```ts
   window.location.href = `/bayar/akun?order=${newOrder.id}`;
   ```

**Dihapus dari `handleSubmit`:** seluruh blok pembuatan `msg` dan `window.open(waUrl, ...)` — pindah ke halaman baru.

### Perubahan teks & tombol (JSX)

- Info-bayar box (baris ±283): teks diganti dari *"Setelah mengisi form ini, transfer sesuai nominal ke rekening yang dipilih, lalu admin akan konfirmasi via WhatsApp."* jadi *"Setelah mengisi form ini, kamu akan dapat akun member. Transfer sesuai nominal, lalu konfirmasi ke admin dari halaman berikutnya."*
- Tombol submit (baris ±293-309): label diganti dari `KONFIRMASI VIA WHATSAPP →` jadi `LANJUTKAN & KONFIRMASI PEMBAYARAN →`. Tambah state `submitting` (disable tombol + teks "MEMPROSES..." selagi insert berjalan), karena sekarang ada 2 insert berurutan (member lalu order) yang makan waktu network.

---

## 3. Halaman baru `src/pages/BayarAkunPage.tsx`

Ikuti pola styling `BayarPage.tsx` persis (const `C`/`G` alias `var(--mr-*)`, font Geist/Geist Mono, tidak import `MR` dari `theme.ts`, layout `maxWidth: 480` single column terpusat karena kontennya lebih sederhana dari `/bayar`).

### Data

```ts
const orderId = new URLSearchParams(window.location.search).get('order');
```

- `useEffect` sekali jalan: kalau `orderId` kosong → set state `notFound = true`, stop.
- Fetch `orders` by id (`select('id, member_id, nama_member, email_member, plan_type, diskon_applied, catatan').eq('id', orderId).single()`).
- Kalau order tidak ketemu / `member_id` kosong → `notFound = true`.
- Fetch `members` by `order.member_id` (`select('nama, password').eq('id', order.member_id).single()`).
- Kalau member tidak ketemu → `notFound = true`.
- Simpan ke state `order` dan `member`.

### Render — state `notFound`

Kartu sederhana: "Data pesanan tidak ditemukan." + tombol kembali ke `/bayar`.

### Render — state sukses

- Header sukses: ikon ✅ + "Akun Kamu Sudah Dibuat!"
- Kartu kredensial (border hijau, mirip kartu "SCAN QRIS BERIKUT"/"TRANSFER KE" di `BayarPage`):
  - Baris **Username**: `{member.nama}` + tombol salin (pola sama seperti tombol salin nomor rekening di `BayarPage`)
  - Baris **Password**: `{member.password}` + tombol salin
  - Baris **Tier**: `SMC Trial`
- Box catatan (kuning/warning, pola sama seperti box "⚠ Transfer tepat..." di `PaymentPage.tsx`): *"Simpan username & password ini baik-baik. Login baru bisa dipakai setelah admin memverifikasi pembayaran kamu (biasanya dalam beberapa saat setelah konfirmasi WhatsApp)."*
- Ringkasan singkat order: Order ID, Plan (`order.plan_type`), Email (`order.email_member`) — untuk konteks, bukan untuk diedit.
- Tombol utama **"Konfirmasi via WhatsApp"** (style sama seperti tombol hijau `KONFIRMASI VIA WHATSAPP` yang lama — background `G.gold`, dibuka via `window.open`):
  ```ts
  const msg = [
    `Halo Admin, saya sudah isi data pembelian Indikator SMC.`,
    ``,
    `*Nama:* ${order.nama_member}`,
    `*Order ID:* ${order.id}`,
    `*Plan:* ${order.plan_type}`,
    `*Catatan:* ${order.catatan}`,
    ``,
    `Mohon konfirmasi pembayaran saya dan aktifkan akun member saya ya. Terima kasih!`,
  ].join('\n');
  const waUrl = `https://wa.me/62${WA_NUMBER.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
  ```
- Link sekunder **"Ke Halaman Login →"** (`window.location.href = '/login'`).

---

## 4. Routing (`src/App.tsx`)

Tambah import:
```ts
import BayarAkunPage from './pages/BayarAkunPage';
```

Tambah di `getPage()` (sebelum/berdampingan dengan cek `/bayar` yang sudah ada — urutan tidak masalah karena keduanya pakai `===` exact match, bukan `startsWith`):
```ts
if (path === '/bayar/akun')             return 'bayar-akun';
```

Tambah di `App()`:
```ts
if (page === 'bayar-akun')        return <BayarAkunPage />;
```

---

## 5. Dampak Data

- `members`: baris baru per pembelian indikator lewat `/bayar` yang namanya belum terdaftar. `tier: 'SMC Trial'`, `is_active: false` sampai admin aktifkan manual.
- `orders`: `member_id` sekarang berisi id member asli (bukan literal `'guest'`), `tier_member: 'SMC Trial'` (bukan `'visitor'`). Ini konsisten dengan order-order dari alur checkout produk member yang sudah ada (`tier_member` selalu mencerminkan tier member saat itu).
- Tidak ada migration SQL baru — semua kolom yang dipakai (`role`, `is_active`, `password`, dll.) sudah ada di tabel `members`.

---

## 6. Error Handling

- Nama sudah terdaftar → error inline di `/bayar`, tidak ada insert sama sekali (member maupun order).
- Insert member gagal (network/RLS) → error inline di `/bayar`, order tidak dibuat (supaya tidak ada order tanpa member terkait).
- Insert order gagal setelah member berhasil dibuat → error inline di `/bayar`; member yang sudah terlanjur dibuat **dibiarkan** (edge case jarang, tidak perlu rollback manual — admin bisa hapus lewat Member tab kalau perlu, sama seperti pola error-handling lain di codebase ini yang tidak melakukan rollback multi-step).
- `/bayar/akun` tanpa `order` param, atau order/member tidak ketemu → tampilan "tidak ditemukan" + tombol kembali ke `/bayar`.

---

## 7. Out of Scope

- Tidak ada auto-login setelah akun dibuat — pembeli tetap harus login manual lewat `/login` pakai kredensial yang ditampilkan.
- Tidak ada perubahan pada `login_member` RPC atau `LoginPage.tsx`.
- Tidak ada notifikasi email/WA otomatis dari sistem (server-side) — konfirmasi tetap manual lewat tombol WhatsApp yang dibuka pembeli sendiri.
- Tidak menambah UI aktivasi member baru di admin — memakai toggle is_active yang sudah ada di tab Member.
- Tidak menangani kasus pembeli lupa/kehilangan password setelah meninggalkan halaman `/bayar/akun` — mengikuti alur "Lupa Password" yang sudah ada di halaman Login (hubungi admin via WhatsApp).
