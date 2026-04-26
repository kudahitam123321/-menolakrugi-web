import { WA_URL } from '../constants';

export default function Footer() {
  return (
    <footer className="bg-[#060b18] border-t border-gray-800/50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-[#0a0f1e] font-bold text-xs">MR</span>
            </div>
            <span className="text-white font-bold text-lg tracking-wide">MENOLAK RUGI</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#kelas" className="hover:text-gray-300 transition-colors">Kelas</a>
            <a href="#faq" className="hover:text-gray-300 transition-colors">FAQ</a>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              Hubungi Kami
            </a>
          </div>

          <p className="text-gray-600 text-sm">© 2026 Menolak Rugi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
