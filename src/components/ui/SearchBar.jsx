import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';
import { getSearchResults, getPosterUrl } from '@/lib/tmdb';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Search, X, Loader2 } from 'lucide-react';

export default function SearchBar({ className = '' }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const { trackSearch } = useAnalytics();
    const navigate = useNavigate();
    const wrapperRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            const sanitizedQuery = query.trim().slice(0, 100); // Limit length
            if (sanitizedQuery.length >= 2) {
                setLoading(true);
                try {
                    const data = await getSearchResults(sanitizedQuery);
                    setResults(data.results?.slice(0, 6) || []);
                    setShowResults(true);
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const sanitizedQuery = query.trim().slice(0, 100);
        if (sanitizedQuery) {
            trackSearch(sanitizedQuery);
            navigate(`/search?q=${encodeURIComponent(sanitizedQuery)}`);
            setShowResults(false);
            setQuery('');
        }
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <form onSubmit={handleSubmit}>
                <div
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl glass transition-all duration-300 ${focused ? 'ring-2 ring-orange-500/50 bg-white/10' : 'hover:bg-white/5'
                        }`}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                    ) : (
                        <Search className={`w-5 h-5 ${focused ? 'text-orange-400' : 'text-gray-400'}`} />
                    )}

                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => { setFocused(true); if (results.length > 0) setShowResults(true); }}
                        onBlur={() => setFocused(false)}
                        placeholder="Search movies..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-400 min-w-0"
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); setResults([]); }}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                </div>
            </form>

            {showResults && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-white/5 bg-accent/20">
                        <p className="text-xs font-semibold text-muted-foreground px-2">Suggestions</p>
                    </div>
                    {results.map((item) => (
                        <Link
                            key={item.id}
                            to={`/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.id}`}
                            onClick={() => { setShowResults(false); setQuery(''); }}
                            className="flex items-center gap-3 p-3 hover:bg-accent transition-colors border-b border-border/50 last:border-none group"
                        >
                            <div className="relative w-10 h-14 flex-shrink-0 rounded bg-muted overflow-hidden">
                                <OptimizedImage
                                    src={getPosterUrl(item.poster_path, 'w92')}
                                    alt={item.title || item.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                    {item.title || item.name}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="uppercase text-[10px] border border-border px-1 rounded">
                                        {item.media_type === 'tv' ? 'TV' : 'Movie'}
                                    </span>
                                    <span>{(item.release_date || item.first_air_date)?.split('-')[0] || 'N/A'}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    <button
                        onClick={handleSubmit}
                        className="w-full p-3 text-center text-xs font-bold text-primary hover:text-primary/80 hover:bg-accent/50 transition-colors"
                    >
                        View all results
                    </button>
                </div>
            )}
        </div>
    );
}
