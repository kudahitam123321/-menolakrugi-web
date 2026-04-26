import { useState } from 'react';
import { Check, ArrowLeft, Tag, X, Zap } from 'lucide-react';

const COUPONS: Record<string, number> = {
  // Tambahkan kupon diskon di sini saat ada event promo
  // Contoh: 'RAMADAN25': 25
};

const courses = [
  {
    id: 'trial',
    badge: 'UJI COBA',
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    title: 'SMC Trial',
    desc: 'Coba rasakan kelasnya dulu — tanpa komitmen, tanpa risiko.',
    originalPrice: null,
    price: 'Rp 99.000',
    priceNote: 'per bulan · bisa berhenti kapan saja',
    amount: 99000,
    highlight: false,
    recommended: false,
    ctaLabel: 'Coba Sekarang — Rp 99k/bln',
    ctaNote: 'Bisa upgrade ke Bronze, Gold, atau Platinum kapan saja jika sudah cocok.',
    features: [
      { bold: 'Akses channel Outlook', desc: '— lihat analisis dan pandangan market dari mentor setiap hari' },
      { bold: 'Ikut sesi live bersama', desc: '— hadir di live session mingguan komunitas' },
      { bold: 'Materi dasar SMC', desc: '— pengenalan struktur market, candlestick, dan cara baca chart' },
      { bold: 'Akses channel komunitas', desc: '— ngobrol dan sharing bareng member lain' },
    ],
  },
  {
    id: 'bronze',
    badge: 'BRONZE',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    title: 'SMC Bronze',
    desc: 'Fondasi kuat dari nol — pahami cara market sesungguhnya bergerak.',
    originalPrice: 'Rp 750.000',
    price: 'Rp 500.000',
    discount: '33%',
    priceNote: 'pembayaran sekali — akses seumur hidup',
    amount: 500000,
    highlight: false,
    recommended: false,
    ctaLabel: 'Mulai Bronze',
    ctaNote: null,
    features: [
      { bold: 'Semua akses Trial', desc: 'sudah termasuk' },
      { bold: 'Materi SMC lengkap', desc: '— struktur, BOS, IDM, order block, hingga daily bias' },
      { bold: 'Video pembelajaran terstruktur', desc: 'yang bisa ditonton ulang kapan saja' },
      { bold: 'Update materi gratis', desc: 'setiap ada penambahan konten baru' },
      { bold: 'Live session Q&A', desc: '— tanya langsung di sesi bersama' },
    ],
  },
  {
    id: 'gold',
    badge: 'GOLD',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    title: 'SMC Gold Mentorship',
    desc: 'Mentoring intensif — dari paham konsep hingga profit konsisten di market nyata.',
    originalPrice: 'Rp 1.500.000',
    price: 'Rp 1.000.000',
    discount: '33%',
    priceNote: 'pembayaran sekali — akses seumur hidup',
    amount: 1000000,
    highlight: true,
    recommended: true,
    ctaLabel: 'Daftar Gold Sekarang',
    ctaNote: null,
    features: [
      { bold: 'Semua fitur Bronze', desc: 'sudah termasuk' },
      { bold: 'Mentoring intensif', desc: '— 2x live session per minggu dengan mentor' },
      { bold: 'Review chart langsung', desc: '— setup trademu dianalisis di depan grup' },
      { bold: 'Evaluasi trading mingguan', desc: '— bongkar kebiasaan buruk sebelum jadi kerugian' },
      { bold: 'Channel Question eksklusif', desc: '— tanya jawab langsung dengan mentor' },
      { bold: 'Channel Funded Trader', desc: '— panduan persiapan challenge prop firm' },
      { bold: 'Akses Mentor Result', desc: '— pelajari setup riil mentor setiap minggu' },
    ],
  },
  {
    id: 'platinum',
    badge: 'PLATINUM',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    title: 'SMC Platinum 1 on 1',
    desc: 'Private mentoring eksklusif — dibimbing langsung hingga mandiri dan konsisten.',
    originalPrice: 'Rp 5.000.000',
    price: 'Rp 3.500.000',
    discount: '30%',
    priceNote: 'pembayaran sekali — akses seumur hidup',
    amount: 3500000,
    highlight: false,
    recommended: false,
    ctaLabel: 'Ambil Platinum Lifetime',
    ctaNote: 'Bayar sekali, akses tidak pernah dicabut. Slot terbatas — batch berikutnya segera dibuka.',
    features: [
      { bold: 'Semua fitur Gold', desc: 'sudah termasuk selamanya' },
      { bold: 'Sesi 1-on-1 private', desc: '— mentoring personal eksklusif langsung dengan mentor' },
      { bold: 'Kurikulum personal', desc: '— disusun sesuai kelemahan spesifik kamu' },
      { bold: 'Review trading journal', desc: '— mentor bedah catatan tradingmu secara rutin' },
      { bold: 'Prioritas di semua channel', desc: '— respons tercepat dari mentor' },
      { bold: 'Pendampingan prop firm', desc: '— dari persiapan hingga lulus challenge' },
    ],
  },
];

function formatRupiah(amount: number) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

export default function CheckoutPage() {
  const [kupon, setKupon] = useState('');
  const [kuponInput, setKuponInput] = useState('');
  const [diskon, setDiskon] = useState(0);
  const [kuponError, setKuponError] = useState('');
  const [kuponSuccess, setKuponSuccess] = useState('');

  function handleApplyKupon() {
    const code = kuponInput.trim().toUpperCase();
    if (!code) return;
    if (COUPONS[code] !== undefined) {
      setDiskon(COUPONS[code]);
      setKupon(code);
      setKuponSuccess(`Kupon berhasil! Diskon ${COUPONS[code]}% aktif.`);
      setKuponError('');
    } else {
      setKuponError('Kupon tidak valid atau sudah tidak berlaku.');
      setKuponSuccess('');
    }
  }

  function handleHapusKupon() {
    setKupon(''); setKuponInput(''); setDiskon(0);
    setKuponError(''); setKuponSuccess('');
  }

  function handlePilih(course: typeof courses[0]) {
    const finalAmount = Math.round(course.amount * (1 - diskon / 100));
    const params = new URLSearchParams({
      kelas: course.title,
      harga: formatRupiah(finalAmount),
      hargaAsli: course.price,
      diskon: diskon > 0 ? `${diskon}%` : '',
      amount: String(finalAmount),
    });
    window.location.href = '/payment?' + params.toString();
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-md border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </a>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-[#0a0f1e] font-bold text-sm">MR</span>
            </div>
            <span className="text-white font-bold text-xl tracking-wide">MENOLAK RUGI</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-32 pb-24">
        <div className="text-center mb-12">
          <span className="text-yellow-500 text-sm font-semibold uppercase tracking-widest">Checkout</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Pilih Kelas Kamu</h1>
          <p className="text-gray-400">Pilih paket yang sesuai, lalu lanjutkan ke pembayaran.</p>
        </div>

        {/* Kupon */}
        <div className="max-w-lg mx-auto mb-12">
          <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag size={18} className="text-yellow-400" />
              <h3 className="text-white font-semibold">Punya Kode Kupon?</h3>
              <span className="text-gray-500 text-xs">(opsional)</span>
            </div>
            {kupon ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                <div>
                  <span className="text-green-400 font-bold font-mono">{kupon}</span>
                  <span className="text-green-400 text-sm ml-2">— Diskon {diskon}% aktif!</span>
                </div>
                <button onClick={handleHapusKupon} className="text-gray-500 hover:text-red-400 transition-colors">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kuponInput}
                  onChange={(e) => setKuponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyKupon()}
                  placeholder="Masukkan kode kupon"
                  className="flex-1 bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors font-mono uppercase"
                />
                <button onClick={handleApplyKupon} className="bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-semibold px-5 py-3 rounded-xl transition-all duration-200">
                  Pakai
                </button>
              </div>
            )}
            {kuponError && <p className="text-red-400 text-sm mt-2">{kuponError}</p>}
            {kuponSuccess && <p className="text-green-400 text-sm mt-2">{kuponSuccess}</p>}
          </div>
        </div>

        {/* Kartu Kelas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {courses.map((course) => {
            const finalAmount = Math.round(course.amount * (1 - diskon / 100));
            const finalHarga = formatRupiah(finalAmount);
            const adaDiskon = diskon > 0;

            return (
              <div
                key={course.id}
                className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  course.recommended
                    ? 'bg-gradient-to-b from-yellow-500/10 to-[#0d1325] border-2 border-yellow-500/60 shadow-xl shadow-yellow-500/10'
                    : 'bg-[#111827] border border-gray-700/50 hover:border-gray-600'
                }`}
              >
                {course.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-[#0a0f1e] text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1">
                    ⭐ PALING DIREKOMENDASIKAN
                  </div>
                )}

                <span className={`self-start text-xs font-bold px-3 py-1 rounded-md border mb-4 tracking-widest ${course.badgeColor}`}>
                  {course.badge}
                </span>

                <h3 className="text-white font-bold text-xl mb-2">{course.title}</h3>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">{course.desc}</p>

                <div className="mb-4">
                  {course.originalPrice && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="line-through text-gray-600 text-sm">{course.originalPrice}</span>
                      {'discount' in course && course.discount && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">
                          Hemat {course.discount}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    {adaDiskon ? (
                      <>
                        <span className="line-through text-gray-500 text-lg">{course.price}</span>
                        <div className="text-3xl font-bold text-yellow-400">{finalHarga}</div>
                      </>
                    ) : (
                      <div className="text-3xl font-bold text-white">{course.price}</div>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{course.priceNote}</p>
                  {adaDiskon && (
                    <span className="inline-block mt-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                      Hemat {diskon}% dengan kupon
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {course.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check size={15} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-snug">
                        <span className="font-semibold text-white">{f.bold}</span>{' '}
                        <span className="text-gray-400">{f.desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePilih(course)}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm ${
                    course.recommended
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-[#0a0f1e] hover:shadow-lg hover:shadow-yellow-500/30'
                      : course.id === 'trial'
                      ? 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/40'
                      : course.id === 'platinum'
                      ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40'
                      : 'bg-[#1a2336] hover:bg-[#1f2b42] text-white border border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <Zap size={16} />
                  {course.ctaLabel}
                </button>

                {course.ctaNote && (
                  <p className="text-gray-600 text-xs text-center mt-3 leading-relaxed">{course.ctaNote}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
