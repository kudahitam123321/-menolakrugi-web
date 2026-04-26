import { Check, ShoppingCart, Zap } from 'lucide-react';

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
    priceTag: '= Rp 1.370/hari selama 1 tahun',
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
    priceTag: '= Rp 2.740/hari selama 1 tahun',
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
    priceTag: 'Setara 11 sesi private @ Rp 300rb/sesi',
    amount: 3500000,
    highlight: false,
    recommended: false,
    ctaLabel: 'Ambil Platinum Lifetime',
    ctaNote: 'Bayar sekali, akses tidak pernah dicabut. Slot terbatas — batch berikutnya segera dibuka.',
    maxNote: 'Maks. 10 member per batch',
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

export default function Courses() {
  function handlePilih(course: typeof courses[0]) {
    const params = new URLSearchParams({
      kelas: course.title,
      harga: course.price,
      amount: String(course.amount),
    });
    window.location.href = '/payment?' + params.toString();
  }

  return (
    <section id="kelas" className="bg-[#0d1325] py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-yellow-500 text-sm font-semibold uppercase tracking-widest">Pilihan Kelas</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Investasi Terbaik untuk Masa Depan</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Pilih kelas yang sesuai dengan level dan kebutuhanmu. Semua kelas dilengkapi materi komprehensif dan support komunitas aktif.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
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

              {/* Badge */}
              <span className={`self-start text-xs font-bold px-3 py-1 rounded-md border mb-4 tracking-widest ${course.badgeColor}`}>
                {course.badge}
              </span>

              {/* Title & Desc */}
              <h3 className="text-white font-bold text-xl mb-2">{course.title}</h3>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">{course.desc}</p>

              {/* Harga */}
              <div className="mb-2">
                {course.originalPrice && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="line-through text-gray-600 text-sm">{course.originalPrice}</span>
                    {course.discount && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">
                        Hemat {course.discount}
                      </span>
                    )}
                  </div>
                )}
                <div className={`font-bold ${course.recommended ? 'text-4xl text-white' : 'text-3xl text-white'}`}>
                  {course.price}
                </div>
                <p className="text-gray-500 text-xs mt-1">{course.priceNote}</p>
              </div>

              {/* Price Tag */}
              {course.priceTag && (
                <div className={`text-xs font-semibold px-3 py-2 rounded-lg mb-5 ${
                  course.recommended
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  = {course.priceTag}
                </div>
              )}

              {/* Max note for Platinum */}
              {'maxNote' in course && course.maxNote && (
                <div className="flex items-center gap-2 text-xs text-red-400 border border-red-500/20 bg-red-500/10 rounded-lg px-3 py-2 mb-4">
                  <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></span>
                  {course.maxNote}
                </div>
              )}

              {/* Features */}
              <ul className="space-y-3 mb-6 flex-1 mt-2">
                {course.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check size={15} className="text-teal-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm leading-snug">
                      <span className="font-semibold text-white">{f.bold}</span>{' '}
                      <span className="text-gray-400">{f.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handlePilih(course)}
                className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm ${
                  course.recommended
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-[#0a0f1e] hover:shadow-lg hover:shadow-yellow-500/30'
                    : course.id === 'trial'
                    ? 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/40 hover:border-teal-400'
                    : course.id === 'platinum'
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 hover:border-purple-400'
                    : 'bg-[#1a2336] hover:bg-[#1f2b42] text-white border border-gray-700 hover:border-gray-500'
                }`}
              >
                <Zap size={16} />
                {course.ctaLabel}
              </button>

              {/* CTA Note */}
              {course.ctaNote && (
                <p className="text-gray-600 text-xs text-center mt-3 leading-relaxed">{course.ctaNote}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
