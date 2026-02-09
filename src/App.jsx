import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import MovieDetails from '@/pages/MovieDetails';
import TVDetails from '@/pages/TVDetails';
import WatchPage from '@/pages/WatchPage';
import SearchPage from '@/pages/SearchPage';
import MediaGridPage from '@/pages/MediaGridPage';


import GenrePage from '@/pages/GenrePage';

function App() {
  return (
    <Router>
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

          {/* Note: I need to update MediaGridPage to support TV categories properly if I had more TV API functions exposed */}
          {/* For now only movies pages are fully wired in MediaGridPage beyond basics */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
