import { useEffect, useState } from 'react';
import MovieCard from '@/components/ui/MovieCard';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';
import AdBanner from '@/components/ui/AdBanner';
import {
    getPopularMovies, getTopRatedMovies, getNowPlayingMovies, getUpcomingMovies,
    getPopularTVShows, getTopRatedTVShows,
    getTrending
} from '@/lib/tmdb';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Hero from '@/components/ui/Hero';

export default function MediaGridPage({ type = 'movie', category = 'popular', title }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [heroItems, setHeroItems] = useState([]);

    // Track Analytics
    usePlatformMetrics(null);

    // Fetch Hero Content (Trending)
    useEffect(() => {
        const fetchHero = async () => {
            try {
                const data = await getTrending(type, 'day');
                setHeroItems(data?.results?.slice(0, 10) || []);
            } catch (error) {
                console.error("Error fetching hero content:", error);
            }
        };
        fetchHero();
    }, [type]);

    // Fetch Grid Content
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let data;
                if (type === 'movie') {
                    if (category === 'popular') data = await getPopularMovies(page);
                    else if (category === 'top_rated') data = await getTopRatedMovies(page);
                    else if (category === 'now_playing') data = await getNowPlayingMovies(page);
                    else if (category === 'upcoming') data = await getUpcomingMovies(page);
                } else if (type === 'tv') {
                    if (category === 'popular') data = await getPopularTVShows(page);
                    else if (category === 'top_rated') data = await getTopRatedTVShows(page);
                    // Add more TV categories if available in tmdb.js
                }

                setItems(data?.results || []);
                setTotalPages(data?.total_pages > 500 ? 500 : data?.total_pages || 1); // Cap at 500 or actual
            } catch (error) {
                console.error(`Error fetching ${type} ${category} page ${page}:`, error);
            } finally {
                setLoading(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        fetchData();
    }, [type, category, page]);

    // Reset page when category changes
    useEffect(() => {
        setPage(1);
    }, [type, category]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // Pagination Logic (Simple Range)
    const getPageNumbers = () => {
        const delta = 2; // Number of pages to show before/after current
        const range = [];
        for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
            range.push(i);
        }

        if (page - delta > 2) range.unshift('...');
        if (page + delta < totalPages - 1) range.push('...');

        range.unshift(1);
        if (totalPages > 1) range.push(totalPages);

        return range;
    };

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Hero Section */}
            <Hero movies={heroItems} key={type} />

            <div className="container mx-auto px-6 py-12">
                <div className="mb-8">
                    <AdBanner />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight drop-shadow-lg border-l-4 border-orange-500 pl-4">
                    {title}
                </h2>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="aspect-[2/3] w-full rounded-xl bg-white/5" />
                                <Skeleton className="h-4 w-3/4 bg-white/5 rounded" />
                                <Skeleton className="h-3 w-1/2 bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-12">
                            {items.map((item) => (
                                <div key={item.id} className="w-full">
                                    <MovieCard item={item} type={type} />
                                </div>
                            ))}
                        </div>

                        {/* Numbered Pagination */}
                        <div className="flex flex-wrap justify-center items-center gap-2 mt-12 pb-24">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="w-10 h-10 rounded-full bg-white/5 border-white/10 hover:bg-orange-500 hover:border-orange-500 text-white disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            {getPageNumbers().map((pageNum, idx) => (
                                pageNum === '...' ? (
                                    <span key={`dots-${idx}`} className="text-gray-500 px-2">...</span>
                                ) : (
                                    <Button
                                        key={pageNum}
                                        variant={pageNum === page ? "default" : "outline"}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`w-10 h-10 rounded-full font-bold transition-all ${pageNum === page
                                            ? 'bg-orange-500 border-none text-white shadow-lg shadow-orange-500/30'
                                            : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            ))}

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                                className="w-10 h-10 rounded-full bg-white/5 border-white/10 hover:bg-orange-500 hover:border-orange-500 text-white disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
