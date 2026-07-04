import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Courses from './components/Courses';
import Partnership from './components/Partnership';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Social from './components/Social';
import AboutUs from './components/AboutUs';
import Footer from './components/Footer';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import LoginPage from './pages/LoginPage';
import MemberPage from './pages/MemberPage';
import AdminPage from './pages/AdminPage';
import DiscordCallbackPage from './pages/DiscordCallbackPage';

// ── Halaman baru (Direction A · Terminal) ──────────────────────────────────
import LandingPage    from './pages/LandingPage';
import SignupPage     from './pages/SignupPage';
import NewPaymentPage from './pages/PaymentPage';        // nama alias supaya tidak konflik
import DashboardPage  from './pages/member/DashboardPage';
import CurriculumPage from './pages/member/CurriculumPage';
import AdminPanel        from './pages/admin/AdminPanel';
import PartnershipPage   from './pages/PartnershipPage';
import CalendarPage      from './pages/CalendarPage';
import KomunitasPage   from './pages/KomunitasPage';
import CompetitionPage from './pages/CompetitionPage';
import BayarPage from './pages/BayarPage';
import BayarAkunPage from './pages/BayarAkunPage';

function getPage() {
  const path = window.location.pathname;
  if (path === '/checkout')               return 'checkout';
  if (path === '/payment')                return 'payment';
  if (path === '/login')                  return 'login';
  if (path === '/signup')                 return 'signup';          // ← baru
  if (path === '/partnership/broker')      return 'partnership-broker';
  if (path === '/partnership/confirm')     return 'partnership-confirm';
  if (path.startsWith('/partnership'))      return 'partnership';
  if (path === '/calendar')                  return 'calendar';
  if (path === '/komunitas')                 return 'komunitas';
  if (path === '/discord-callback')       return 'discord-callback';
  if (path === '/competition')            return 'competition';
  if (path === '/bayar')                  return 'bayar';
  if (path === '/bayar/akun')             return 'bayar-akun';

  // Member area
  if (path === '/trading-plan')           return 'trading-plan';
  if (path === '/member/kurikulum')       return 'kurikulum';       // ← baru
  if (path.startsWith('/member'))         return 'member';

  // Admin
  if (path === '/admin/trading-plan')     return 'admin-trading-plan';
  if (path === '/admin/competition')      return 'admin-competition';
  if (path === '/admin/panel')            return 'admin-panel';
  if (path.startsWith('/admin'))          return 'admin';

  return 'home';
}

function App() {
  const page = getPage();

  // ── Halaman lama (tetap jalan) ──────────────────────────────────────────
  if (page === 'checkout')          return <CheckoutPage />;
  if (page === 'payment')           return <PaymentPage />;
  if (page === 'login')             return <LoginPage />;
  if (page === 'discord-callback')  return <DiscordCallbackPage />;

  // ── Halaman baru ────────────────────────────────────────────────────────
  if (page === 'signup')            return <SignupPage />;
  if (page === 'bayar')             return <BayarPage />;
  if (page === 'bayar-akun')        return <BayarAkunPage />;
  if (page === 'partnership')         return <PartnershipPage step="intro" />;
  if (page === 'partnership-broker')    return <PartnershipPage step="broker" />;
  if (page === 'partnership-confirm')   return <PartnershipPage step="confirm" />;
  if (page === 'calendar')              return <CalendarPage />;
  if (page === 'komunitas')             return <KomunitasPage />;
  if (page === 'competition')           return <CompetitionPage />;
  if (page === 'trading-plan')        return <DashboardPage />;
  if (page === 'admin-trading-plan')  return <AdminPanel />;
  if (page === 'admin-competition')   return <AdminPanel />;
  if (page === 'kurikulum')         return <CurriculumPage />;
  if (page === 'admin-panel')       return <AdminPanel />;          // /admin/panel → tampilan baru

  // ── Member dashboard → pakai yang baru ─────────────────────────────────
  if (page === 'member')            return <DashboardPage />;       // ganti ke tampilan baru
                                                                    // kalau mau tetap pakai lama: return <MemberPage />;

  // ── Admin → pakai yang baru ─────────────────────────────────────────────
  if (page === 'admin')             return <AdminPanel />;          // ganti ke tampilan baru
                                                                    // kalau mau tetap pakai lama: return <AdminPage />;

  // ── Home / Landing page ─────────────────────────────────────────────────
  // Ganti ke LandingPage baru, atau tetap pakai yang lama (komponen di bawah)
  return <LandingPage />;
}

export default App;
