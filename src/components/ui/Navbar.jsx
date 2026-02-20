import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Search, Menu, X, Bell, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPosterUrl, getSearchResults, getNowPlayingMovies, getMovieGenres } from '@/lib/tmdb';
import OptimizedImage from './OptimizedImage';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [newReleases, setNewReleases] = useState([]);
    const [genres, setGenres] = useState([]);
    const [showGenres, setShowGenres] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Fetch new releases for notifications
        getNowPlayingMovies().then(data => {
            setNewReleases(data.results?.slice(0, 5) || []);
        });

        // Fetch Genres
        getMovieGenres().then(data => {
            setGenres(data.genres || []);
        });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2) {
                const data = await getSearchResults(searchQuery);
                setSearchResults(data.results?.slice(0, 5) || []);
                setShowResults(true);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery) {
            navigate(`/search?q=${searchQuery}`);
            setShowResults(false);
            setSearchQuery('');
        }
    };

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Movies', href: '/movies' },
        { name: 'TV Shows', href: '/tv' },
        { name: 'New & Popular', href: '/upcoming' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/5 shadow-2xl h-16' : 'bg-gradient-to-b from-black/80 to-transparent h-24'
            } flex items-center`}>
            <div className="max-w-[1920px] mx-auto w-full px-6 sm:px-8 lg:px-12 xl:px-16 flex items-center justify-between gap-8">
                <Logo className="scale-110" />

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.href}
                            className={`text-sm font-bold uppercase tracking-wide transition-all duration-300 ${location.pathname === link.href ? 'text-orange-500 scale-105' : 'text-gray-300 hover:text-white hover:scale-105'
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {/* Genres Dropdown */}
                    <div
                        className="relative group"
                        onMouseEnter={() => setShowGenres(true)}
                        onMouseLeave={() => setShowGenres(false)}
                    >
                        <button className="flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-gray-300 hover:text-white transition-colors py-4">
                            Genres
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showGenres ? 'rotate-180' : ''}`} />
                        </button>

                        <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[600px] transition-all duration-300 origin-top ${showGenres ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                            <div className="bg-black/95 backdrop-blur-2xl border border-white/10 rounded-xl p-6 shadow-2xl grid grid-cols-3 gap-y-2 gap-x-4">
                                {genres.map((genre) => (
                                    <Link
                                        key={genre.id}
                                        to={`/genre/${genre.id}`}
                                        className="text-gray-400 hover:text-orange-500 hover:bg-white/5 p-2 rounded-lg transition-all text-sm font-medium"
                                        onClick={() => setShowGenres(false)}
                                    >
                                        {genre.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-4 flex-1 lg:flex-none justify-end">
                    <div className="relative hidden md:block w-64 lg:w-80 group">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                            <form onSubmit={handleSearchSubmit}>
                                <Input
                                    placeholder="Search titles, people, genres..."
                                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-orange-500/50 rounded-full transition-all duration-300 group-focus-within:bg-black/95 group-focus-within:w-[400px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                />
                            </form>
                        </div>

                        {/* Search Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute top-full right-0 left-[-40px] mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-fade-in w-[440px]">
                                {searchResults.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={`/${item.media_type || 'movie'}/${item.id}`}
                                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                    >
                                        <div className="w-10 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                            <OptimizedImage
                                                src={getPosterUrl(item.poster_path)}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-white truncate">{item.title || item.name}</h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span>{(item.release_date || item.first_air_date)?.split('-')[0] || 'N/A'}</span>
                                                <Badge variant="outline" className="text-[10px] h-4 px-1">{item.media_type || 'movie'}</Badge>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notifications Dropdown */}
                    <div className="relative hidden md:block">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full relative"
                            onClick={() => setShowNotifications(!showNotifications)}
                            onBlur={() => setTimeout(() => setShowNotifications(false), 200)}
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                        </Button>

                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-fade-in z-50">
                                <div className="p-3 border-b border-white/10 font-bold text-white">New Releases</div>
                                {newReleases.map(item => (
                                    <Link
                                        key={item.id}
                                        to={`/movie/${item.id}`}
                                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                    >
                                        <div className="w-12 h-16 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                            <OptimizedImage
                                                src={getPosterUrl(item.poster_path)}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                                            <p className="text-xs text-orange-400 font-medium">Out Now</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="lg:hidden text-gray-300"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 top-0 bg-black/95 backdrop-blur-xl z-40 animate-fade-in pt-24 overflow-y-auto">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-4 right-6 text-white"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <X className="w-8 h-8" />
                    </Button>
                    <div className="p-8 space-y-8 text-center">
                        <div className="flex flex-col gap-6">
                            <h3 className="text-xl font-bold text-white mb-4">Browse Genres</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {genres.map((genre) => (
                                    <Link
                                        key={genre.id}
                                        to={`/genre/${genre.id}`}
                                        className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {genre.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
