import { useEffect, useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getMovieVideos, getTVShowVideos, getTrailerUrl } from '@/lib/tmdb';
import { Loader2, X, AlertCircle } from 'lucide-react';

export default function TrailerModal({ isOpen, onClose, trailerUrl: initialTrailerUrl, movieId, movieTitle, mediaType = 'movie' }) {
    const [isClosing, setIsClosing] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState(initialTrailerUrl);
    const [loading, setLoading] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [error, setError] = useState(null);
    const { trackTrailerView } = useAnalytics();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsClosing(false);

            // If we don't have a trailer URL but have an ID, fetch it
            if (!initialTrailerUrl && movieId) {
                fetchTrailer();
            } else {
                setTrailerUrl(initialTrailerUrl);
                if (initialTrailerUrl && movieId) {
                    trackTrailerView(movieId, movieTitle || 'Unknown');
                }
            }
        } else {
            document.body.style.overflow = 'unset';
            setTrailerUrl(null);
            setError(null);
            setIframeLoading(true);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, initialTrailerUrl, movieId, movieTitle, mediaType]);

    const fetchTrailer = async () => {
        setLoading(true);
        setError(null);
        try {
            const videosData = mediaType === 'tv'
                ? await getTVShowVideos(movieId)
                : await getMovieVideos(movieId);

            const url = getTrailerUrl(videosData);
            if (url) {
                setTrailerUrl(url);
                trackTrailerView(movieId, movieTitle || 'Unknown');
            } else {
                setError('Trailer not found for this title');
            }
        } catch (err) {
            console.error('Error fetching trailer:', err);
            setError('Failed to load trailer');
        } finally {
            setLoading(false);
            if (error) setIframeLoading(false);
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
            <div
                className="absolute inset-0 bg-black/95 backdrop-blur-md transition-opacity"
                onClick={handleClose}
            ></div>

            <div className={`relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/20 border border-white/10 transform transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-slide-up'}`}>
                {/* Header/Close button */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
                    <button
                        onClick={handleClose}
                        className="p-2.5 rounded-full bg-black/60 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10 group active:scale-95"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {(loading || (trailerUrl && iframeLoading)) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                        <p className="text-white/60 font-medium animate-pulse">
                            {loading ? 'Fetching trailer...' : 'Buffering...'}
                        </p>
                    </div>
                ) : error ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/40 space-y-6 p-8 text-center bg-[#0a0f1a]">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xl font-black text-white">{error}</p>
                            <p className="text-sm max-w-xs mx-auto">This title may not have an available YouTube trailer in our current database.</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                        >
                            Close Window
                        </button>
                    </div>
                ) : trailerUrl ? (
                    <iframe
                        src={`${trailerUrl}?autoplay=1&rel=0&modestbranding=1&origin=${window.location.origin}`}
                        className={`w-full h-full transition-opacity duration-500 ${iframeLoading ? 'opacity-0' : 'opacity-100'}`}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title="Trailer"
                        onLoad={() => setIframeLoading(false)}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/40 space-y-6 bg-[#0a0f1a]">
                        <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <AlertCircle className="w-10 h-10 text-orange-500" />
                        </div>
                        <p className="text-xl font-black text-white">Trailer not available</p>
                        <button
                            onClick={handleClose}
                            className="px-8 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-[0_0_20px_rgba(255,103,0,0.3)]"
                        >
                            Return to Selection
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

