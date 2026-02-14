import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import WatchPlayer from '@/components/WatchPlayer';

import { getMovieDetails, getTVShowDetails } from '@/lib/tmdb';
import { Play, AlertTriangle, Server, Star, X, ShieldAlert, MessageCircle, Send, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WatchPage() {
    const { id, type } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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
                    <a
                        href="https://t.me/zionmovies1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white hover:text-blue-200 bg-[#229ED9] hover:bg-[#1e8dbf] px-4 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(34,158,217,0.4)] hover:shadow-[0_0_20px_rgba(34,158,217,0.6)] ml-3"
                    >
                        <Send className="w-4 h-4 fill-current" />
                        <span className="font-bold text-sm">Join Channel</span>
                    </a>
                </div>

                <WatchPlayer item={item} id={id} type={type} />

                <div className="mt-8 bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-400">
                        If you experience any playback errors, please try switching servers inside the player window or
                        <span onClick={() => window.location.reload()} className="text-amber-500 hover:underline cursor-pointer ml-1 font-bold">refresh the page</span>.
                    </p>
                </div>
            </div>
        </main>
    );
}
