import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import MovieDetails from '@/pages/MovieDetails';
import TVDetails from '@/pages/TVDetails';
import WatchPage from '@/pages/WatchPage';
import SearchPage from '@/pages/SearchPage';
import MediaGridPage from '@/pages/MediaGridPage';
import GenrePage from '@/pages/GenrePage';

import AdminLogin from '@/pages/admin/AdminLogin';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminAds from '@/pages/admin/AdminAds';
import AdminLive from '@/pages/admin/AdminLive';
import AdminUsers from '@/pages/admin/AdminUsers';
import { Navigate } from 'react-router-dom';

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
      <Routes>
        {/* Admin Routes (Isolated from Global Layout) */}
        <Route path="/birthna/login" element={<AdminLogin />} />
        <Route path="/birthna" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminAnalytics />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="live" element={<AdminLive />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Public App Routes */}
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;
