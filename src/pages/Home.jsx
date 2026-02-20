import { useEffect, useState } from 'react';
import Hero from '@/components/ui/Hero';
import MovieRow from '@/components/ui/MovieRow';
import { getTrending, getPopularMovies, getTopRatedMovies, getNowPlayingMovies, getPopularTVShows } from '@/lib/tmdb';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
    const [heroMovies, setHeroMovies] = useState([]);
    const [heroLoading, setHeroLoading] = useState(true);

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
                // Fetch Trending for Hero and Row
                const trendingData = await getTrending('movie', 'day');
                const results = trendingData.results || [];

                const getDaysDiff = (dateStr) => {
                    if (!dateStr) return 0;
                    return (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
                };

                // HD Filter: Released > 45 days ago
                const hdMovies = results.filter(m => getDaysDiff(m.release_date) > 30); // Loosened from 45 to 30

                // Hero Selection: Prefer HD, but always fill to 5
                let heroSelection = [];
                if (hdMovies.length >= 5) {
                    heroSelection = hdMovies.sort(() => 0.5 - Math.random()).slice(0, 5);
                } else {
                    // Start with HD, fill rest with whatever is trending
                    const others = results.filter(m => !hdMovies.find(h => h.id === m.id));
                    heroSelection = [...hdMovies, ...others.slice(0, 5 - hdMovies.length)];
                }

                setHeroMovies(heroSelection);
                setHeroLoading(false);

                // Trending Row: Fallback to all trending if no HD found
                setRows(prev => ({
                    ...prev,
                    trending: hdMovies.length > 5 ? hdMovies : results
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
                const popularHD = popularResults.filter(m => getDaysDiff(m.release_date) > 30);

                setRows(prev => ({
                    ...prev,
                    popular: popularHD.length >= 10 ? popularHD : popularResults,
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
