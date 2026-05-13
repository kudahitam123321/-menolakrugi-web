// App.tsx — Update router untuk integrasikan semua halaman baru
// Tambahkan import dan route ini ke file App.tsx yang sudah ada

// ─── Imports baru ─────────────────────────────────────────────────────────────
import LandingPage    from './pages/LandingPage';
import SignupPage     from './pages/SignupPage';
import PaymentPage    from './pages/PaymentPage';
import DashboardPage  from './pages/member/DashboardPage';
import CurriculumPage from './pages/member/CurriculumPage';
import AdminPanel     from './pages/admin/AdminPanel';

// ─── Tambahkan route ini ke dalam <Routes> ────────────────────────────────────

/*
<Routes>
  // Public
  <Route path="/"              element={<LandingPage />} />
  <Route path="/signup"        element={<SignupPage />} />
  <Route path="/payment"       element={<PaymentPage />} />
  <Route path="/login"         element={<LoginPage />} />   // halaman login yang sudah ada

  // Member (protected)
  <Route path="/member"           element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
  <Route path="/member/kurikulum" element={<ProtectedRoute><CurriculumPage /></ProtectedRoute>} />
  // ... route member lainnya

  // Admin (protected + role check)
  <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
</Routes>
*/

// ─── Global CSS — tambahkan ke index.css / global.css ────────────────────────

/*
  Tambahkan ini di file CSS global (misal src/index.css):

  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@300;400;500;600;700&display=swap');

  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: 'Geist', system-ui, sans-serif;
    background: #070707;
    color: #e7e5e4;
    -webkit-font-smoothing: antialiased;
  }

  @keyframes mr-ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
  @keyframes mr-blink  { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
  .mr-blink { animation: mr-blink 1s steps(1) infinite; }
*/

// ─── Package dependencies yang perlu ada ─────────────────────────────────────

/*
  Semua package sudah tersedia di stack Menolak Rugi:
  ✓ react, react-dom
  ✓ react-router-dom
  ✓ @supabase/supabase-js
  ✓ typescript
  ✓ vite

  Tidak ada package baru yang dibutuhkan!
  Font Geist sudah di index.html — tinggal pastikan di-load.
*/

export {};
