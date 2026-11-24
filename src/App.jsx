import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import MovieDetailPage from './pages/MovieDetailPage.jsx';
import WatchPage from './pages/WatchPage.jsx';
import { ContinueWatchingPage, HistoryPage, WatchlistPage } from './pages/LibraryPages.jsx';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { AboutPage, ContactPage } from './pages/StaticPages.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-[#09090B] text-white">
              <Navbar />
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/movies" element={<CatalogPage fixedType="movie" />} />
                  <Route path="/movies/:id" element={<MovieDetailPage />} />
                  <Route path="/series" element={<CatalogPage fixedType="series" />} />
                  <Route path="/genres" element={<CatalogPage />} />
                  <Route path="/genres/:slug" element={<CatalogPage />} />
                  <Route path="/search" element={<CatalogPage />} />
                  <Route path="/watch/:id" element={<WatchPage />} />
                  <Route path="/watchlist" element={<WatchlistPage />} />
                  <Route path="/continue-watching" element={<ContinueWatchingPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
