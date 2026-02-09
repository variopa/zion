import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '@/components/ui/MovieCard';
import { getSearchResults } from '@/lib/tmdb';
import { Loader2 } from 'lucide-react';

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) return;
            setLoading(true);
            try {
                const data = await getSearchResults(query);
                setResults(data.results || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    return (
        <div className="min-h-screen container mx-auto px-6 py-24">
            <h1 className="text-3xl font-bold text-white mb-8">
                Search Results for "<span className="text-orange-500">{query}</span>"
            </h1>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {results.map((item) => (
                        <div key={item.id} className="w-full">
                            <MovieCard item={item} type={item.media_type || 'movie'} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-12">
                    No results found for "{query}"
                </div>
            )}
        </div>
    );
}
