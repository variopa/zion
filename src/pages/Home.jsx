import { useEffect, useState } from 'react';
import Hero from '@/components/ui/Hero';
import MovieRow from '@/components/ui/MovieRow';
import { getTrending, getPopularMovies, getTopRatedMovies, getNowPlayingMovies, getPopularTVShows } from '@/lib/tmdb';
import { Skeleton } from '@/components/ui/skeleton';
import AdBanner from '@/components/ui/AdBanner';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';

export default function Home() {
    const [heroMovies, setHeroMovies] = useState([]);
    const [heroLoading, setHeroLoading] = useState(true);

    // Track Analytics
    usePlatformMetrics(null);

    const [rows, setRows] = useState({
        trending: [],
        popular: [],
        topRated: [],
        nowPlaying: [],
        popularTV: []
    });
    const [rowsLoading, setRowsLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch Trending for Hero and Row - Use 'week' for more HD content
                const trendingData = await getTrending('movie', 'week');
                const results = trendingData.results || [];

                const getDaysDiff = (dateStr) => {
                    if (!dateStr) return 0;
                    const diff = (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
                    return isNaN(diff) ? 0 : diff;
                };

                // HD Filter: Released > 45 days ago (Strict)
                const hdMovies = results.filter(m => getDaysDiff(m.release_date) > 45);

                // Hero Selection: Prefer HD movies, if not enough HD, use trending as fallback for hero ONLY
                let heroSelection = [];
                if (hdMovies.length >= 5) {
                    heroSelection = hdMovies.sort(() => 0.5 - Math.random()).slice(0, 5);
                } else {
                    heroSelection = results.slice(0, 5);
                }

                setHeroMovies(heroSelection);
                setHeroLoading(false);

                // Trending Row: Show ONLY HD movies
                setRows(prev => ({
                    ...prev,
                    trending: hdMovies
                }));

                // Fetch other rows
                const [
                    popularData,
                    topRatedData,
                    nowPlayingData,
                    popularTVData
                ] = await Promise.all([
                    getPopularMovies(),
                    getTopRatedMovies(),
                    getNowPlayingMovies(),
                    getPopularTVShows()
                ]);

                // HD Filter for popular section
                const popularResults = popularData?.results || [];
                const popularHD = popularResults.filter(m => getDaysDiff(m.release_date) > 45);

                setRows(prev => ({
                    ...prev,
                    popular: popularHD,
                    topRated: topRatedData?.results || [],
                    nowPlaying: nowPlayingData?.results || [],
                    popularTV: popularTVData?.results || []
                }));

            } catch (error) {
                console.error('Failed to fetch home data', error);
                setHeroLoading(false);
            } finally {
                setRowsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    return (
        <div className="bg-background min-h-screen pb-20 overflow-hidden">
            {/* Hero Section */}
            {heroLoading ? (
                <div className="relative h-screen w-full bg-muted animate-pulse flex items-end pb-24 px-12">
                    <div className="space-y-4 w-full max-w-4xl">
                        <div className="h-16 w-3/4 bg-white/5 rounded-xl"></div>
                        <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                    </div>
                </div>
            ) : (
                <Hero movies={heroMovies} />
            )}

            {/* Content Rows */}
            <div className="relative z-10 -mt-20 lg:-mt-32 space-y-4 lg:space-y-8 bg-gradient-to-t from-background via-background to-transparent pt-20">
                {rowsLoading && !heroLoading ? (
                    // Skeleton Rows
                    [1, 2, 3].map((i) => (
                        <div key={i} className="py-8 px-6 md:px-12 space-y-4">
                            <Skeleton className="h-8 w-64 bg-white/5 rounded-lg" />
                            <div className="flex gap-6 overflow-hidden">
                                {[1, 2, 3, 4, 5, 6].map((j) => (
                                    <Skeleton key={j} className="h-72 w-48 shrink-0 bg-white/5 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        <div className="px-6 md:px-12 mb-8">
                            <AdBanner />
                        </div>
                        <MovieRow title="Trending Now (HD)" items={rows.trending} />
                        <MovieRow title="Popular Movies" items={rows.popular} type="movie" viewAllHref="/movies" />
                        <MovieRow title="Top Rated TV" items={rows.popularTV} type="tv" viewAllHref="/tv" />
                        <MovieRow title="New Releases" items={rows.nowPlaying} type="movie" />
                        <MovieRow title="Critically Acclaimed" items={rows.topRated} type="movie" />
                    </>
                )}
            </div>
        </div>
    );
}
