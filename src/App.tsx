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

function getPage() {
  const path = window.location.pathname;
  if (path === '/checkout') return 'checkout';
  if (path === '/payment') return 'payment';
  if (path === '/login') return 'login';
  if (path === '/member') return 'member';
  if (path === '/admin') return 'admin';
  if (path === '/discord-callback') return 'discord-callback';
  return 'home';
}

function App() {
  const page = getPage();
  if (page === 'checkout') return <CheckoutPage />;
  if (page === 'payment') return <PaymentPage />;
  if (page === 'login') return <LoginPage />;
  if (page === 'member') return <MemberPage />;
  if (page === 'admin') return <AdminPage />;
  if (page === 'discord-callback') return <DiscordCallbackPage />;

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Courses />
      <Partnership />
      <Testimonials />
      <FAQ />
      <Social />
      <AboutUs />
      <Footer />
    </div>
  );
}

export default App;
