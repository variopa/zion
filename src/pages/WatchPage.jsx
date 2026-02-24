import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import WatchPlayer from '@/components/WatchPlayer';

import { getMovieDetails, getTVShowDetails } from '@/lib/tmdb';
import { Play, AlertTriangle, Server, Star, X, ShieldAlert, MessageCircle, Send, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdBanner from '@/components/ui/AdBanner';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';

export default function WatchPage() {
    const { id, type } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Track Analytics
    usePlatformMetrics(item?.title || item?.name);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = type === 'tv'
                ? await getTVShowDetails(id)
                : await getMovieDetails(id);

            if (!data) throw new Error('Not found');
            setItem(data);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && type) fetchData();
    }, [id, type]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
                <div className="text-center space-y-4">
                    <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto" />
                    <h1 className="text-3xl font-bold text-white">Something went wrong</h1>
                    <p className="text-gray-400">We couldn't load the content. Please try refreshing.</p>
                    <Button
                        onClick={fetchData}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 py-6 text-lg"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Refresh Page
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black pt-24 pb-32">

            <div className="container mx-auto px-4">
                {/* Feedback & Actions */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white border-l-4 border-orange-500 pl-4">Now Watching</h2>
                    <a
                        href="https://t.me/variopa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 px-4 py-2 rounded-full transition-colors border border-blue-500/20"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-bold text-sm">Feedback</span>
                    </a>
                </div>

                {/* Advertisement Container */}
                <AdBanner className="mb-8" />

                <WatchPlayer item={item} id={id} type={type} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                {item.release_date && (
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                        {new Date(item.release_date).getFullYear()}
                                    </span>
                                )}
                                {item.vote_average > 0 && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-bold">{item.vote_average.toFixed(1)}</span>
                                    </div>
                                )}
                                {item.runtime > 0 && (
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                        {Math.floor(item.runtime / 60)}h {item.runtime % 60}m
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-white">Overview</h3>
                                <p className="text-gray-300 leading-relaxed text-lg">
                                    {item.overview || "No overview available for this title."}
                                </p>
                            </div>

                            {item.genres && item.genres.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Genres</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {item.genres.map((g) => (
                                            <span
                                                key={g.id}
                                                className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 border border-white/5 text-sm hover:bg-white/10 hover:text-white transition-colors cursor-default"
                                            >
                                                {g.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Additional Info */}
                    <div className="space-y-6">
                        <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <h4 className="font-bold text-amber-500">Playback Issues?</h4>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                If you experience any playback errors, audio issues, or buffering, please try switching servers inside the player window.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-2.5 rounded-xl bg-amber-500/10 text-amber-500 font-bold hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
