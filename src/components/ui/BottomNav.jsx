import { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, PlayCircle, Monitor, Search, X, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSearchResults, getPosterUrl } from '@/lib/tmdb';
import OptimizedImage from './OptimizedImage';
import { motion } from 'framer-motion';

export default function BottomNav() {
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                const data = await getSearchResults(query);
                setResults(data.results?.slice(0, 5) || []);
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query) {
            navigate(`/search?q=${query}`);
            setSearchOpen(false);
            setQuery('');
        }
    };

    const tabs = [
        { name: 'Home', icon: Home, path: '/' },
        { name: 'Movies', icon: PlayCircle, path: '/movies' },
        { name: 'TV Show', icon: Monitor, path: '/tv' },
        { name: 'New', icon: Compass, path: '/upcoming' },
    ];

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-t border-white/10 z-50 lg:hidden px-4 pb-2">
                <div className="flex items-center justify-between h-full relative">
                    {tabs.map((tab, idx) => {
                        const isActive = location.pathname === tab.path;

                        // Insert Search Button in middle
                        if (idx === 2) {
                            return (
                                <Fragment key="search-section">
                                    <button
                                        key="search-trigger"
                                        onClick={() => setSearchOpen(true)}
                                        className="relative -top-5"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg shadow-orange-500/40 flex items-center justify-center transform active:scale-95 transition-transform text-white border-4 border-black">
                                            <Search className="w-6 h-6" />
                                        </div>
                                    </button>
                                    <Link
                                        key={tab.name}
                                        to={tab.path}
                                        className={`relative flex flex-col items-center gap-1 p-2 transition-colors duration-300 ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute -top-3 w-8 h-1 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.8)]"
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <tab.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                                        <span className="text-[10px] font-medium">{tab.name}</span>
                                    </Link>
                                </Fragment>
                            );
                        }

                        return (
                            <Link
                                key={tab.name}
                                to={tab.path}
                                className={`relative flex flex-col items-center gap-1 p-2 transition-colors duration-300 ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -top-3 w-8 h-1 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.8)]"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <tab.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                                <span className="text-[10px] font-medium">{tab.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Search Popup Overlay */}
            {searchOpen && (
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
                    <div className="p-4 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Search</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchOpen(false)}
                                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSearch} className="mb-6 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                autoFocus
                                className="pl-12 h-14 text-lg bg-white/5 border-white/10 rounded-2xl"
                                placeholder="Search ZION..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </form>

                        <div className="flex-1 overflow-y-auto space-y-4">
                            {results.map((item) => (
                                <Link
                                    key={item.id}
                                    to={`/${item.media_type || 'movie'}/${item.id}`}
                                    onClick={() => setSearchOpen(false)}
                                    className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                                        <OptimizedImage
                                            src={getPosterUrl(item.poster_path)}
                                            className="w-full h-full object-cover"
                                            alt={item.title}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white">{item.title || item.name}</h4>
                                        <p className="text-sm text-gray-400">{(item.release_date || item.first_air_date)?.split('-')[0]}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
