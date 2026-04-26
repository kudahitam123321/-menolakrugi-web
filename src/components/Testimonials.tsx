import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const WA_FORM_LINK = 'https://forms.gle/S56wzXaEBaNhPriL7';

const testimonials = [
  {
    name: 'Ricky Johanes A. Nainggolan',
    kelas: 'SMC Platinum Mentorship',
    bintang: 5,
    ulasan: 'Belakangan ini materinya semakin menarik dan menemukan benang merah setelah sekian lama grup ini vakum sampai saya mengira grup ini sudah bakalan tidak ada lagi. Tapi ternyata asa itu tetap ada. Hidup PTMR!',
  },
  {
    name: 'Febry Pangestu',
    kelas: 'SMC Gold Mentorship',
    bintang: 5,
    ulasan: 'Sangat amat memberikan pencerahan tentang dunia trading, terutama pada psikologi trading dan risk management. Untuk metode teknikal analisisnya sendiri juga sudah baku, tidak pernah diubah-ubah untuk SOP nya, jadi sangat memudahkan untuk trader yang trading menggunakan full teknikal analisis.',
  },
  {
    name: 'Muhammad Hairil Anwar',
    kelas: 'SMC Silver Mentorship',
    bintang: 5,
    ulasan: 'Memuaskan, penjelasannya mudah dipahami.',
  },
  {
    name: 'David Herwanto',
    kelas: 'SMC Gold Mentorship',
    bintang: 5,
    ulasan: 'Masih mempelajari, kadang penasaran mentor gampang banget, sayanya kok susah ambil keputusan. Saran nih Bang, beberapa kali luangkan waktu untuk balas chat pribadi ya, karena kadang ada yang perlu diceritakan secara pribadi. Semoga saya bisa konsisten!',
  },
  {
    name: 'Mervyn Zhu',
    kelas: 'SMC Gold Mentorship',
    bintang: 5,
    ulasan: 'Belajar di PTMR merupakan keputusan terbaik yang berpengaruh dalam segi psikologis dan risk management di dunia trading yang selama ini saya pelajari. SOPnya jelas dan tidak berubah-ubah serta memiliki entry reason dalam hal pengambilan keputusan.',
  },
  {
    name: 'Member PTMR',
    kelas: 'SMC Gold Mentorship',
    bintang: 5,
    ulasan: 'Jujur awalnya sudah bingung juga, hampir semua ilmu dicoba dipelajari dan hasil akhirnya tetap loss. Lalu ikut Member PTMR yang sudah jelas trading plan-nya, sudah baku dan sesuai SOP. Jadi intinya bukan saja ilmu yang sangat bagus, tapi mengajarkan bagaimana cara trading yang benar dan baik.',
  },
  {
    name: 'Erick',
    kelas: 'SMC Gold Mentorship',
    bintang: 5,
    ulasan: 'Metode ini sangat cocok bagiku dan membantu untuk menjadi trader profesional yang insyaallah profitabilitas. Sang mentor sangat ramah dan menjelaskan metode ini sangat terperinci dan mudah dipahami. Para membernya juga saling membantu, diskusi, dan menasehati — hal ini membuat mental terbentuk dengan lingkungan yang mendukung.',
  },
  {
    name: 'Miftachul Huda',
    kelas: 'SMC Gold Mentorship',
    bintang: 5,
    ulasan: 'Dari sekian mentor yang pernah saya join komunitasnya mengenai materi SMC, hanya Menolak Rugi yang pemahamannya simple dan penjelasannya detail serta gampang diresap oleh orang awam seperti saya.',
  },
  {
    name: 'Muhammad Lukman Ardiansyah',
    kelas: 'SMC Bronze Mentorship',
    bintang: 5,
    ulasan: 'Setelah belajar metode SMC PTMR, trading ga lagi asal-asalan. Jadi tau kapan entry, dimana SL dan Take Profit. Ga bingung lagi arah pergerakan market, toh mau naik atau turun tetap ada peluang. Sekarang tinggal memperdalam materi yang ada.',
  },
  {
    name: 'Togo',
    kelas: 'SMC Silver Mentorship',
    bintang: 5,
    ulasan: 'Dengan materi yang simple dipahami menggunakan metode SMC, dan mentor yang sabar membimbing kami.',
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          className={s <= count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = useCallback((dir: 'prev' | 'next') => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActive((prev) =>
        dir === 'next'
          ? (prev + 1) % testimonials.length
          : (prev - 1 + testimonials.length) % testimonials.length
      );
      setAnimating(false);
    }, 200);
  }, [animating]);

  useEffect(() => {
    const timer = setInterval(() => go('next'), 5000);
    return () => clearInterval(timer);
  }, [go]);

  const t = testimonials[active];

  return (
    <section className="bg-[#0d1325] py-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-yellow-500 text-sm font-semibold uppercase tracking-widest">Testimoni</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Kata Member Kami</h2>
          <p className="text-gray-400">Pengalaman nyata dari member yang sudah bergabung.</p>
        </div>

        <div className="relative">
          <div
            className={`bg-[#111827] border border-gray-700/50 rounded-2xl p-8 sm:p-12 transition-opacity duration-200 ${
              animating ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
              <Quote size={24} className="text-yellow-400" />
            </div>

            <p className="text-gray-200 text-lg leading-relaxed mb-8 min-h-[80px]">
              "{t.ulasan}"
            </p>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-[#0a0f1e] font-bold text-sm">{t.name[0]}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{t.name}</p>
                  <p className="text-gray-500 text-sm">{t.kelas}</p>
                </div>
              </div>
              <StarRating count={t.bintang} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!animating) {
                      setAnimating(true);
                      setTimeout(() => { setActive(i); setAnimating(false); }, 200);
                    }
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active ? 'bg-yellow-500 w-6' : 'bg-gray-700 w-2'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => go('prev')}
                className="w-10 h-10 rounded-xl bg-[#1a2336] border border-gray-700 hover:border-yellow-500/50 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => go('next')}
                className="w-10 h-10 rounded-xl bg-[#1a2336] border border-gray-700 hover:border-yellow-500/50 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm mb-4">Sudah jadi member? Bagikan pengalaman kamu!</p>
          <a
            href={WA_FORM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 font-semibold px-6 py-3 rounded-xl transition-all duration-200 text-sm"
          >
            <Star size={16} className="fill-yellow-400" />
            Tulis Ulasan Kamu
          </a>
        </div>
      </div>
    </section>
  );
}
