import { useRef } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from './MovieCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MovieRow({ title, items, type = 'movie', viewAllHref }) {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -600 : 600;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="py-8 lg:py-12 animate-fade-in">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6 lg:mb-8 px-6 sm:px-8 lg:px-12 xl:px-16 container mx-auto">
                <div className="space-y-1">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-sm">
                        {title}
                    </h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-orange-600 to-transparent rounded-full mt-2"></div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View All Link */}
                    {viewAllHref && (
                        <Link to={viewAllHref}>
                            <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-orange-500 hover:bg-transparent">
                                View All →
                            </Button>
                        </Link>
                    )}

                    {/* Scroll Buttons */}
                    <div className="hidden md:flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('left')}
                            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('right')}
                            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-white"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable Row */}
            <div
                ref={scrollRef}
                className="flex gap-4 md:gap-5 lg:gap-6 overflow-x-auto scrollbar-hide px-6 sm:px-8 lg:px-12 xl:px-16 pb-4 scroll-smooth"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {items.map((item, index) => (
                    <div
                        key={`${item.id}-${index}`}
                        className="flex-shrink-0 w-44 sm:w-48 md:w-52 lg:w-56"
                    >
                        <MovieCard item={item} type={type} className="h-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
