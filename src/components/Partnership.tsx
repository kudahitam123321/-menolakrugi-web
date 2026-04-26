import { ExternalLink, Gift } from 'lucide-react';

const brokers = [
  {
    name: 'Broker HFM',
    code: '30520271',
    href: 'https://register.hfmtrade-ind.com/sv/en/new-live-account/?refid=30520271',
  },
  {
    name: 'Broker EXNESS',
    code: 'a7tps7wodw',
    href: 'https://one.exnessonelink.com/a/a7tps7wodw',
  },
];

export default function Partnership() {
  return (
    <section className="bg-[#0d1325] py-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent p-8 sm:p-12">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift size={24} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Join Gratis via Partnership</h2>
              <p className="text-gray-400">
                Dapatkan akses kelas <span className="text-yellow-400 font-semibold">GRATIS</span> cukup dengan mendaftar melalui broker partner kami. Tidak ada biaya tersembunyi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {brokers.map((b) => (
              <div key={b.name} className="bg-[#111827] rounded-xl p-6 border border-gray-700/50 hover:border-yellow-500/30 transition-colors duration-200">
                <h4 className="text-white font-bold text-lg mb-1">{b.name}</h4>
                <p className="text-gray-500 text-sm mb-4">Kode Referral: <span className="text-yellow-400 font-mono font-semibold">{b.code}</span></p>
                <a
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/30 text-sm"
                >
                  Daftar Sekarang
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
