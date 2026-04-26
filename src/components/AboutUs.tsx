import { Target, Brain, TrendingUp, Users, Check } from 'lucide-react';

const keunggulan = [
  {
    icon: TrendingUp,
    title: 'Sistem Belajar Terstruktur',
    desc: 'Dari Basic → Advanced → Expert, semua ada jalurnya.',
  },
  {
    icon: Target,
    title: 'Fokus pada Proses, Bukan Hasil Instan',
    desc: 'Kami lebih menghargai konsistensi daripada sekadar profit sesaat.',
  },
  {
    icon: Brain,
    title: 'Mentorship Nyata, Bukan Sekadar Materi',
    desc: 'Member dibimbing, dievaluasi, dan diarahkan langsung.',
  },
  {
    icon: Users,
    title: 'Komunitas Berkualitas',
    desc: 'Lingkungan yang mendukung growth, bukan toxic atau flexing semata.',
  },
];

const untukSiapa = [
  'Pemula yang ingin belajar dari dasar dengan benar',
  'Trader yang masih belum konsisten',
  'Trader yang ingin naik level ke arah profesional',
];

export default function AboutUs() {
  return (
    <section id="about" className="bg-[#0a0f1e] py-24">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-yellow-500 text-sm font-semibold uppercase tracking-widest">About Us</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Tentang Menolak Rugi</h2>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Ekosistem edukasi trading yang berfokus pada metode{' '}
            <span className="text-yellow-400 font-semibold">Smart Money Concept (SMC)</span>,
            dirancang untuk membantu trader berkembang dari nol hingga konsisten profit
            dengan pendekatan yang terstruktur dan realistis.
          </p>
        </div>

        {/* Tagline */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-6 mb-16 text-center">
          <p className="text-white text-lg sm:text-xl font-semibold">
            Kami tidak menjual mimpi.
          </p>
          <p className="text-yellow-400 text-lg sm:text-xl font-semibold">
            Kami membangun skill, mindset, dan konsistensi.
          </p>
        </div>

        {/* Visi */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-yellow-400" />
            </div>
            <h3 className="text-white text-2xl font-bold">Visi Kami</h3>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed pl-14">
            Menciptakan trader yang <span className="text-yellow-400 font-semibold">mandiri, disiplin, dan konsisten profit</span> —
            bukan trader yang bergantung pada sinyal.
          </p>
        </div>

        {/* Keunggulan */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Brain size={20} className="text-yellow-400" />
            </div>
            <h3 className="text-white text-2xl font-bold">Apa yang Membuat Kami Berbeda?</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {keunggulan.map((item) => (
              <div
                key={item.title}
                className="bg-[#111827] border border-gray-700/50 hover:border-yellow-500/30 rounded-2xl p-6 flex gap-4 transition-colors duration-200"
              >
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon size={20} className="text-yellow-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filosofi */}
        <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-8 mb-16 text-center">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={20} className="text-yellow-400" />
          </div>
          <h3 className="text-white text-xl font-bold mb-4">Filosofi Kami</h3>
          <blockquote className="text-gray-300 text-lg italic leading-relaxed max-w-2xl mx-auto">
            "Trading bukan soal seberapa cepat profit, tapi seberapa{' '}
            <span className="text-yellow-400 not-italic font-semibold">konsisten kamu bertahan dan berkembang</span>{' '}
            di market."
          </blockquote>
        </div>

        {/* Untuk Siapa */}
        <div className="bg-gradient-to-br from-yellow-500/5 to-transparent border border-yellow-500/20 rounded-2xl p-8">
          <h3 className="text-white text-2xl font-bold mb-6">🔥 Untuk Siapa Kelas Ini?</h3>
          <ul className="space-y-4 mb-8">
            {untukSiapa.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-yellow-400" />
                </div>
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-yellow-500/20 pt-6">
            <p className="text-white font-semibold text-center text-lg">
              Kalau kamu serius ingin berkembang,{' '}
              <span className="text-yellow-400">ini tempatnya.</span>
            </p>
            <div className="flex justify-center mt-6">
              <a
                href="#kelas"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-[#0a0f1e] font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/30"
              >
                Mulai Sekarang
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
