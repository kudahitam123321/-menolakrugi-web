import { TrendingUp, Users, Star, Award } from 'lucide-react';

export default function Hero() {
  return (
    <section className="min-h-screen bg-[#0a0f1e] flex items-center relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(234,179,8,0.12),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(234,179,8,0.06),_transparent_60%)]" />
      <div className="absolute top-20 right-10 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 py-20 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-yellow-400 text-sm font-medium">200+ Member Aktif</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Belajar Trading{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              Tanpa Ribet
            </span>{' '}
            Sampai Konsisten Profit
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl">
            Kuasai Smart Money Concept (SMC) dari nol hingga mahir. Sistem pembelajaran step-by-step, materi lengkap, dan komunitas aktif yang siap membantu perjalanan trading kamu.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <a
              href="#kelas"
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-[#0a0f1e] font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-yellow-500/30 text-center text-lg"
            >
              Pilih Kelas Sekarang
            </a>
            <a
              href="#faq"
              className="border border-gray-600 hover:border-yellow-500/50 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-center text-lg"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Users, value: '200+', label: 'Member Aktif' },
              { icon: Star, value: '4.9/5', label: 'Rating Kelas' },
              { icon: TrendingUp, value: 'SMC', label: 'Metode Teruji' },
              { icon: Award, value: 'Lifetime', label: 'Akses Materi' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center sm:items-start gap-1">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-yellow-500" />
                  <span className="text-white font-bold text-xl">{value}</span>
                </div>
                <span className="text-gray-500 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
