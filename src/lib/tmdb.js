import axios from 'axios';

const tmdbFetch = async (endpoint) => {
    try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        if (!apiKey) {
            console.error('[ZION-DEBUG] VITE_TMDB_API_KEY missing in .env. API calls will fail.');
            return { results: [] };
        }

        const response = await axios.get(`https://api.themoviedb.org/3${endpoint}`, {
            params: { api_key: apiKey }
        });
        return response.data;

    } catch (error) {
        console.error('[ZION-FETCH] Error:', error.response?.data || error.message);
        throw error;
    }
};

// Get Trending Movies/TV Shows
export const getTrending = async (mediaType = 'movie', timeWindow = 'week') => {
    return await tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
};

// Get Popular Movies
export const getPopularMovies = async (page = 1) => {
    return await tmdbFetch(`/movie/popular?page=${page}`);
};

// Get Popular TV Shows
export const getPopularTVShows = async (page = 1) => {
    return await tmdbFetch(`/tv/popular?page=${page}`);
};

// Get Top Rated Movies
export const getTopRatedMovies = async (page = 1) => {
    return await tmdbFetch(`/movie/top_rated?page=${page}`);
};

// Get Top Rated TV Shows
export const getTopRatedTVShows = async (page = 1) => {
    return await tmdbFetch(`/tv/top_rated?page=${page}`);
};

// Get Now Playing Movies
export const getNowPlayingMovies = async (page = 1) => {
    return await tmdbFetch(`/movie/now_playing?page=${page}`);
};

// Get Upcoming Movies
export const getUpcomingMovies = async (page = 1) => {
    return await tmdbFetch(`/movie/upcoming?page=${page}`);
};

// Get Movie Details
export const getMovieDetails = async (movieId) => {
    return await tmdbFetch(`/movie/${movieId}`);
};

// Get TV Show Details
export const getTVShowDetails = async (tvId) => {
    return await tmdbFetch(`/tv/${tvId}`);
};

// Get Movie Credits (Cast & Crew)
export const getMovieCredits = async (movieId) => {
    return await tmdbFetch(`/movie/${movieId}/credits`);
};

// Get TV Show Credits
export const getTVShowCredits = async (tvId) => {
    return await tmdbFetch(`/tv/${tvId}/credits`);
};

// Get Similar Movies
export const getSimilarMovies = async (movieId) => {
    return await tmdbFetch(`/movie/${movieId}/similar`);
};

// Get Similar TV Shows
export const getSimilarTVShows = async (tvId) => {
    return await tmdbFetch(`/tv/${tvId}/similar`);
};

// Get Movie Videos (Trailers)
export const getMovieVideos = async (movieId) => {
    return await tmdbFetch(`/movie/${movieId}/videos`);
};

// Get TV Show Videos
export const getTVShowVideos = async (tvId) => {
    return await tmdbFetch(`/tv/${tvId}/videos`);
};

// Search Movies
export const searchMovies = async (query, page = 1) => {
    return await tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
};

// Search TV Shows
export const searchTVShows = async (query, page = 1) => {
    return await tmdbFetch(`/search/tv?query=${encodeURIComponent(query)}&page=${page}`);
};

// Multi Search (Movies + TV Shows + People)
export const multiSearch = async (query, page = 1) => {
    return await tmdbFetch(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
};

export const getSearchResults = multiSearch;

// Get Movie Genres
export const getMovieGenres = async () => {
    return await tmdbFetch('/genre/movie/list');
};

// Get TV Genres
export const getTVGenres = async () => {
    return await tmdbFetch('/genre/tv/list');
};

// Discover Movies by Genre
export const discoverMoviesByGenre = async (genreId, page = 1) => {
    return await tmdbFetch(`/discover/movie?with_genres=${genreId}&page=${page}&sort_by=popularity.desc`);
};

// Discover TV Shows by Genre
export const discoverTVShowsByGenre = async (genreId, page = 1) => {
    return await tmdbFetch(`/discover/tv?with_genres=${genreId}&page=${page}&sort_by=popularity.desc`);
};

// Get TV Season Details
export const getTVSeasonDetails = async (tvId, seasonNumber) => {
    return await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
};

// Get Movie Keywords
export const getMovieKeywords = async (movieId) => {
    return await tmdbFetch(`/movie/${movieId}/keywords`);
};

// Get TV Keywords
export const getTVKeywords = async (tvId) => {
    return await tmdbFetch(`/tv/${tvId}/keywords`);
};

// Get Movie Reviews
export const getMovieReviews = async (movieId) => {
    return await tmdbFetch(`/movie/${movieId}/reviews`);
};

// Get TV Reviews
export const getTVReviews = async (tvId) => {
    return await tmdbFetch(`/tv/${tvId}/reviews`);
};

// Helper: Get Image URL
export const getImageUrl = (path, size = 'original') => {
    if (!path) return '/placeholder-movie.jpg';
    return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Helper: Get Backdrop URL
export const getBackdropUrl = (path, size = 'original') => {
    return getImageUrl(path, size);
};

// Helper: Get Poster URL
export const getPosterUrl = (path, size = 'w500') => {
    return getImageUrl(path, size);
};

// Helper: Get YouTube Trailer URL
export const getTrailerUrl = (videos) => {
    if (!videos || !videos.results) return null;

    const trailer = videos.results.find(
        video => video.type === 'Trailer' && video.site === 'YouTube'
    );

    return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
};

// Helper: Format Runtime
export const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Helper: Format Release Date
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Helper: Get Rating Color
export const getRatingColor = (rating) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    return 'text-red-500';
};
