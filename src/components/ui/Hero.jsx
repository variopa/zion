import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import OptimizedImage from '@/components/ui/OptimizedImage';
import TrailerModal from '@/components/ui/TrailerModal';
import { getBackdropUrl } from '@/lib/tmdb';
import { Play, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Hero({ movies }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);
    const [trailerId, setTrailerId] = useState(null);

    // Auto-advance - Standard Cinematic Interval (30 seconds)
    useEffect(() => {
        const timer = setInterval(() => {
            if (!isTrailerOpen) {
                nextSlide();
            }
        }, 30000);
        return () => clearInterval(timer);
    }, [currentIndex, isTrailerOpen]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    };

    if (!movies || movies.length === 0) return null;

    const currentMovie = movies[currentIndex];
    if (!currentMovie) return null;

    // Swipe handlers
    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset, velocity) => {
        return Math.abs(offset) * velocity;
    };

    return (
        <div className="relative w-full h-[100dvh] overflow-hidden bg-black text-white group">
            <AnimatePresence initial={false} mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }} // Faster fade to feel more responsive
                    className="absolute inset-0 w-full h-full"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x);
                        if (swipe < -swipeConfidenceThreshold) {
                            nextSlide();
                        } else if (swipe > swipeConfidenceThreshold) {
                            prevSlide();
                        }
                    }}
                >
                    {/* Background Image - Stabilized to prevent "shifting to middle" */}
                    <div className="absolute inset-0 w-full h-full">
                        <motion.div
                            className="w-full h-full"
                        // Removed scale animation that caused layout shift perception
                        >
                            <OptimizedImage
                                src={getBackdropUrl(currentMovie.backdrop_path)}
                                alt={currentMovie.title}
                                className="w-full h-full object-cover"
                                priority={true}
                                sizes="100vw"
                            />
                        </motion.div>
                        {/* Deep Cinematic Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-black/40"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
                    </div>

                    {/* Content - Hard Left Alignment */}
                    <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 z-10 w-full">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                            className="max-w-[90%] md:max-w-4xl space-y-4 md:space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md text-orange-400 text-[10px] sm:text-xs font-bold tracking-wider uppercase animate-fade-in">
                                #1 in Movies Today
                            </div>

                            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] drop-shadow-2xl text-white">
                                {currentMovie.title || currentMovie.name}
                            </h1>

                            <p className="text-sm sm:text-base md:text-xl text-gray-300 line-clamp-3 md:line-clamp-2 drop-shadow-lg font-medium max-w-xl md:max-w-2xl leading-relaxed">
                                {currentMovie.overview}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-2 md:pt-4">
                                <Link to={`/watch/${currentMovie.media_type || 'movie'}/${currentMovie.id}`}>
                                    <Button size="lg" className="rounded-full h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-[0_0_40px_rgba(234,88,12,0.4)] border-none transition-all hover:scale-105">
                                        <Play className="w-5 h-5 md:w-6 md:h-6 mr-2 fill-current" />
                                        Watch Now
                                    </Button>
                                </Link>

                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="rounded-full h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold bg-white/5 border-white/20 backdrop-blur-xl hover:bg-white/10 text-white transition-all hover:scale-105"
                                    onClick={() => {
                                        setTrailerId(currentMovie.id);
                                        setIsTrailerOpen(true);
                                    }}
                                >
                                    <Info className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                                    More Info
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Carousel Indicators - Custom Style */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20 hidden lg:flex">
                {movies.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`transition-all duration-300 rounded-full ${currentIndex === idx ? 'w-1 h-8 bg-orange-500' : 'w-1 h-2 bg-white/20 hover:bg-white/40'}`}
                    />
                ))}
            </div>

            {/* Mobile Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 lg:hidden">
                {movies.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`transition-all duration-300 rounded-full ${currentIndex === idx ? 'w-6 h-1 bg-orange-500' : 'w-1.5 h-1 bg-white/30'}`}
                    />
                ))}
            </div>

            <TrailerModal
                isOpen={isTrailerOpen}
                onClose={() => setIsTrailerOpen(false)}
                trailerId={trailerId}
            />
        </div>
    );
}
