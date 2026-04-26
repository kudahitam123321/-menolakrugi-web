import { useState, useEffect } from 'react';
import { Menu, X, Youtube, LogIn, LayoutDashboard } from 'lucide-react';

const navLinks = [
  { label: 'Kelas', href: '#kelas' },
  { label: 'About Us', href: '#about' },
  { label: 'Komunitas', href: '#komunitas' },
  { label: 'FAQ', href: '#faq' },
];

function getSession() {
  try {
    const raw = localStorage.getItem('mr_session');
    if (raw) return { type: 'member', ...JSON.parse(raw) };
  } catch {}
  return null;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<{ type: string; nama?: string; tier?: string } | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const dashboardHref = session?.type === 'member' ? '/member' : '/admin';
  const dashboardLabel = session?.type === 'member' ? `Dashboard` : 'Admin Panel';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-md border-b border-yellow-500/20">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
            <span className="text-[#0a0f1e] font-bold text-sm">MR</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">MENOLAK RUGI</span>
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors duration-200">
              {link.label}
            </a>
          ))}
          <a href="https://www.youtube.com/@MENOLAKRUGI" target="_blank" rel="noopener noreferrer"
            className="text-gray-400 hover:text-red-400 transition-colors duration-200" title="YouTube Menolak Rugi">
            <Youtube size={20} />
          </a>

          {/* Login / Dashboard */}
          {session ? (
            <a href={dashboardHref}
              className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 hover:border-yellow-400 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200">
              <LayoutDashboard size={15} />
              {dashboardLabel}
            </a>
          ) : (
            <a href="/login"
              className="flex items-center gap-2 text-gray-300 hover:text-white border border-gray-700 hover:border-yellow-500/50 text-sm font-medium px-4 py-2 rounded-full transition-all duration-200">
              <LogIn size={15} />
              Login
            </a>
          )}

          <a href="#kelas"
            className="bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-semibold text-sm px-5 py-2 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/30">
            Lihat Kelas
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button className="md:hidden text-gray-300 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#0a0f1e] border-t border-gray-800/50 px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="text-gray-300 hover:text-white text-sm font-medium py-2 transition-colors duration-200">
              {link.label}
            </a>
          ))}
          <a href="https://www.youtube.com/@MENOLAKRUGI" target="_blank" rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-gray-300 hover:text-red-400 text-sm font-medium py-2 transition-colors duration-200">
            <Youtube size={18} /> YouTube
          </a>

          {session ? (
            <a href={dashboardHref} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-yellow-400 text-sm font-semibold py-2 transition-colors duration-200">
              <LayoutDashboard size={18} />
              {dashboardLabel}
              {session.nama && <span className="text-yellow-600 text-xs ml-1">({session.nama.split(' ')[0]})</span>}
            </a>
          ) : (
            <a href="/login" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium py-2 transition-colors duration-200">
              <LogIn size={18} /> Login Member / Admin
            </a>
          )}

          <a href="#kelas" onClick={() => setMenuOpen(false)}
            className="bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-semibold text-sm px-5 py-3 rounded-full text-center transition-all duration-200 mt-1">
            Lihat Kelas
          </a>
        </div>
      )}
    </nav>
  );
}
