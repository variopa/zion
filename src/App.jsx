import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import MovieDetails from '@/pages/MovieDetails';
import TVDetails from '@/pages/TVDetails';
import WatchPage from '@/pages/WatchPage';
import SearchPage from '@/pages/SearchPage';
import MediaGridPage from '@/pages/MediaGridPage';
import GenrePage from '@/pages/GenrePage';

// Lazy load Admin components to isolate them from the public bundle
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminAds = lazy(() => import('@/pages/admin/AdminAds'));
const AdminLive = lazy(() => import('@/pages/admin/AdminLive'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const ChatbotAnalytics = lazy(() => import('@/pages/admin/ChatbotAnalytics'));

// Minimal loading fallback for admin components
const AdminLoader = () => (
  <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

const MainApp = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movie/:id" element={<MovieDetails />} />
      <Route path="/tv/:id" element={<TVDetails />} />
      <Route path="/watch/:type/:id" element={<WatchPage />} />
      <Route path="/search" element={<SearchPage />} />

      <Route path="/movies" element={<MediaGridPage type="movie" category="popular" title="Popular Movies" />} />
      <Route path="/tv" element={<MediaGridPage type="tv" category="popular" title="Popular TV Shows" />} />
      <Route path="/upcoming" element={<MediaGridPage type="movie" category="upcoming" title="Upcoming Movies" />} />

      <Route path="/genre/:id" element={<GenrePage />} />
    </Routes>
  </Layout>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<AdminLoader />}>
        <Routes>
          {/* Admin Routes (Isolated from Global Layout) */}
          <Route path="/birthna/login" element={<AdminLogin />} />
          <Route path="/birthna" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminAnalytics />} />
            <Route path="ads" element={<AdminAds />} />
            <Route path="live" element={<AdminLive />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="chatbot" element={<ChatbotAnalytics />} />
          </Route>

          {/* Public App Routes */}
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
