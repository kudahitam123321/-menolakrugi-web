import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Bagaimana metode pembelajaran di kelas ini?',
    a: 'Pembelajaran menggunakan sistem step by step dari basic sampai advanced, lengkap dengan materi video, live session, dan praktik langsung di market. Fokus utama: memahami logika Smart Money Concept, bukan sekadar hafalan.',
  },
  {
    q: 'Apakah kelas ini cocok untuk pemula?',
    a: 'Sangat cocok. Materi disusun dari nol, jadi walaupun belum pernah trading, kamu tetap bisa ikut dan paham alurnya secara bertahap.',
  },
  {
    q: 'Kalau saya sudah pernah trading, masih worth it ikut?',
    a: 'Justru sangat worth it. Kamu akan memperbaiki mindset, struktur analisa, dan entry yang lebih presisi menggunakan konsep SMC yang lebih terarah.',
  },
  {
    q: 'Belum ada waktu ikut kelas, gimana?',
    a: 'Tenang, materi bisa diakses fleksibel. Kamu bisa belajar kapan saja sesuai waktu luang tanpa harus ikut di jam tertentu.',
  },
  {
    q: 'Apakah ada batasan waktu akses kelasnya?',
    a: 'Tidak ada batasan (lifetime access). Kamu bisa akses materi kapan saja bahkan setelah kelas selesai.',
  },
  {
    q: 'Apakah ada sesi mentoring langsung?',
    a: 'Ada. Kamu bisa ikut sesi live, diskusi, dan tanya jawab langsung, termasuk review market dan evaluasi trading.',
  },
  {
    q: 'Kalau ada update materi, apakah bayar lagi?',
    a: 'Tidak. Semua update materi akan kamu dapatkan secara gratis tanpa biaya tambahan.',
  },
  {
    q: 'Apakah ada komunitas untuk diskusi?',
    a: 'Ada. Kamu akan masuk ke komunitas eksklusif untuk sharing, diskusi, dan update market bersama member lain.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-[#0a0f1e] py-24">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-yellow-500 text-sm font-semibold uppercase tracking-widest">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Pertanyaan Umum</h2>
          <p className="text-gray-400">Jawaban untuk pertanyaan yang paling sering ditanyakan.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                open === i ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-gray-700/50 bg-[#111827]'
              }`}
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-white font-medium leading-snug">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-yellow-500 flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
