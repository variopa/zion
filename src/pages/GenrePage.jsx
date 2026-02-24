import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import MovieCard from '@/components/ui/MovieCard';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';
import { discoverMoviesByGenre, discoverTVShowsByGenre, getMovieGenres, getTVGenres } from '@/lib/tmdb';
import { Skeleton } from '@/components/ui/skeleton';

export default function GenrePage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'movie';

    // Track Analytics
    usePlatformMetrics(null);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [genreName, setGenreName] = useState('');

    useEffect(() => {
        const fetchGenreName = async () => {
            try {
                // Try to find the genre name from the list
                const genreData = type === 'movie' ? await getMovieGenres() : await getTVGenres();
                const genre = genreData.genres.find(g => g.id.toString() === id);
                if (genre) setGenreName(genre.name);
                else setGenreName('Genre');
            } catch (error) {
                console.error("Error fetching genre list:", error);
                setGenreName('Genre');
            }
        };

        const fetchData = async () => {
            setLoading(true);
            try {
                let data;
                if (type === 'movie') {
                    data = await discoverMoviesByGenre(id);
                } else {
                    data = await discoverTVShowsByGenre(id);
                }
                setItems(data?.results || []);
            } catch (error) {
                console.error(`Error fetching genre ${id}:`, error);
            } finally {
                setLoading(false);
            }
        };

        fetchGenreName();
        fetchData();
        window.scrollTo(0, 0);
    }, [id, type]);

    return (
        <div className="min-h-screen container mx-auto px-6 py-24">

            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-lg text-center md:text-left">
                {genreName}
            </h1>
            <p className="text-gray-400 mb-8 text-center md:text-left capitalize">{type === 'movie' ? 'Movies' : 'TV Shows'}</p>

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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="w-full">
                            <MovieCard item={item} type={type} />
                        </div>
                    ))}
                </div>
            )}

            {items.length === 0 && !loading && (
                <div className="text-center text-gray-500 py-20">
                    <p>No items found for this genre.</p>
                </div>
            )}
        </div>
    );
}
