import { useState, useEffect } from 'react';
import { getTVSeasonDetails } from '@/lib/tmdb';
import { PROVIDERS } from '@/lib/providers';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Play, AlertTriangle, Server, Star, X, ShieldAlert } from 'lucide-react';

export default function WatchPlayer({ item, id, type = 'movie' }) {
    const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [embedUrl, setEmbedUrl] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [availableEpisodes, setAvailableEpisodes] = useState([]);
    const [showAdBlockModal, setShowAdBlockModal] = useState(false);
    const [showShieldGuide, setShowShieldGuide] = useState(false);

    const { trackProviderSwitch, trackEpisodeSelect, trackContentPlay } = useAnalytics();

    // Modal & Guide Logic
    useEffect(() => {
        if (selectedProvider.id === 'embedmaster') {
            setShowShieldGuide(false);
            // Always show modal after delay when switching to this provider
            const timer = setTimeout(() => setShowAdBlockModal(true), 1500);
            return () => clearTimeout(timer);
        } else {
            setShowAdBlockModal(false);
            // Always show guide after delay when switching to these providers
            const timer = setTimeout(() => setShowShieldGuide(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [selectedProvider]);

    const dismissAdBlockModal = () => {
        setShowAdBlockModal(false);
    };

    const dismissShieldGuide = () => {
        setShowShieldGuide(false);
    };

    // Fetch season details when season changes
    useEffect(() => {
        if (type === 'tv') {
            const fetchSeasonDetails = async () => {
                try {
                    const seasonData = await getTVSeasonDetails(id, season);
                    if (seasonData && seasonData.episodes) {
                        const now = new Date();
                        const airedEpisodes = seasonData.episodes.filter(ep => {
                            if (!ep.air_date) return false;
                            return new Date(ep.air_date) <= now;
                        });
                        setAvailableEpisodes(airedEpisodes);
                    }
                } catch (error) {
                    console.error('Error fetching season details:', error);
                    // Fallback using item props if available
                    const currentSeason = item.seasons?.find(s => s.season_number === season);
                    const now = new Date();

                    if (currentSeason && currentSeason.air_date && new Date(currentSeason.air_date) <= now) {
                        const count = currentSeason.episode_count || 0;
                        setAvailableEpisodes(Array.from({ length: count }, (_, i) => ({ episode_number: i + 1 })));
                    } else {
                        setAvailableEpisodes([]);
                    }
                }
            };
            fetchSeasonDetails();
        }
    }, [id, season, type, item.seasons]);

    // Update embed URL
    useEffect(() => {
        const url = selectedProvider.getUrl(id, type === 'tv' ? season : null, type === 'tv' ? episode : null);
        setEmbedUrl(url);
    }, [selectedProvider, id, type, season, episode]);

    const seasons = type === 'tv' ? item.seasons?.filter(s => s.season_number > 0) || [] : [];

    return (
        <div className="w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 space-y-8 z-10 mx-auto">
            {/* Player Container */}
            <div className="relative w-full aspect-video max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-black group">
                <div className="absolute -inset-2 bg-orange-500/20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 -z-10"></div>

                {!isPlaying && (
                    <div
                        className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-500 cursor-pointer group-hover:bg-black/60"
                        onClick={() => {
                            setIsPlaying(true);
                            const title = item.title || item.name;
                            trackContentPlay(id, type, title);
                        }}
                    >
                        <div className="flex flex-col items-center gap-4 transform transition-transform duration-300 group-hover:scale-110">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.5)] hover:bg-orange-400 transition-colors">
                                <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1 fill-current" />
                            </div>
                            <div className="text-center">
                                <span className="block text-white font-bold text-lg md:text-xl drop-shadow-lg">Click to Play</span>
                                <span className="text-gray-400 text-xs md:text-sm mt-1">Loads video securely</span>
                            </div>
                        </div>
                    </div>
                )}

                {isPlaying && (
                    <iframe
                        key={`${selectedProvider.id}-${season}-${episode}`}
                        src={selectedProvider.id === 'embedmaster' ? embedUrl : `/player.html?url=${encodeURIComponent(embedUrl)}`}
                        className="absolute inset-0 w-full h-full z-20 rounded-2xl"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        title={item.title || item.name}
                    />
                )}
            </div>

            {/* AdBlock Modal (EmbedMaster) */}
            {showAdBlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-orange-500/30 p-6 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden text-center space-y-4 animate-in zoom-in-95 duration-300">
                        {/* Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-orange-500/20 blur-3xl -z-10"></div>

                        <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-orange-500/40">
                            <ShieldAlert className="w-8 h-8 text-orange-500" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">Ad Blocker Recommended</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                For the smoothest experience on <span className="text-orange-400 font-bold">Server 1</span>, we highly recommend enabling an Ad Blocker to prevent popup ads.
                            </p>
                        </div>

                        <button
                            onClick={dismissAdBlockModal}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 active:scale-95"
                        >
                            Okay, Got it
                        </button>
                    </div>
                </div>
            )}

            {/* Shield Guide (Other Providers) */}
            {showShieldGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0a0a0a] border border-blue-500/30 p-8 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden text-center space-y-6 animate-in zoom-in-95 duration-300">
                        {/* Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 blur-[100px] -z-10 rounded-full pointer-events-none"></div>

                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                            <ShieldAlert className="w-10 h-10 text-blue-400" />
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Secure Playback Active</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                We've enabled the <span className="text-blue-400 font-bold">Interceptor Shield</span> to protect you from malicious ads and redirects.
                            </p>

                            <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-3 mt-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">How to Watch</h4>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/20">1</div>
                                        <div>
                                            <p className="text-white font-medium text-sm">First Click</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Disengages the security shield.</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-px bg-white/5"></div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0 border border-orange-500/20">2</div>
                                        <div>
                                            <p className="text-white font-medium text-sm">Second Click</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Starts the video playback safely.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={dismissShieldGuide}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2 group"
                        >
                            <span>I Understand</span>
                            <Play className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            )}

            {/* Controls & Info Bar */}
            <div className="flex flex-col xl:flex-row gap-8 items-start justify-between bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/5">
                <div className="space-y-2 max-w-2xl">
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {item.title || item.name}
                    </h1>
                    <p className="text-base md:text-lg text-gray-400 font-medium flex items-center gap-3">
                        {type === 'tv' ? (
                            <>
                                <span className="text-orange-400">Season {season}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                <span className="text-purple-400">Episode {episode}</span>
                            </>
                        ) : (
                            <span className="text-gray-400">{item.tagline || 'Now Playing'}</span>
                        )}
                    </p>
                </div>

                <div className="flex flex-col gap-4 w-full xl:w-auto">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <span className="text-xs md:text-sm font-medium text-amber-200">
                            Try switching servers if video fails to load
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {PROVIDERS.map((provider) => (
                            <button
                                key={provider.id}
                                onClick={() => {
                                    setSelectedProvider(provider);
                                    trackProviderSwitch(provider.id, provider.name);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedProvider.id === provider.id
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <Server className="w-4 h-4" />
                                {provider.name}
                                {provider.recommended && <Star className="w-3 h-3 fill-current text-yellow-300" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* TV Season Selector */}
            {type === 'tv' && (
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/5 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                        Select Episode
                    </h3>

                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {seasons.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => { setSeason(s.season_number); setEpisode(1); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${season === s.season_number
                                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    Season {s.season_number}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {availableEpisodes.map((ep) => (
                                <button
                                    key={ep.episode_number}
                                    onClick={() => {
                                        setEpisode(ep.episode_number);
                                        const title = item.title || item.name;
                                        trackEpisodeSelect(id, title, season, ep.episode_number);
                                    }}
                                    className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${episode === ep.episode_number
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {ep.episode_number}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
