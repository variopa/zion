import { Link } from 'react-router-dom';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { getPosterUrl } from '@/lib/tmdb';
import { Play, Star, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function MovieCard({ item, type = 'movie', className }) {
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date;
    const year = date ? new Date(date).getFullYear() : 'N/A';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';

    // Quality Algorithm
    const isReleased = date && new Date(date) < new Date();
    const daysSinceRelease = date ? (new Date() - new Date(date)) / (1000 * 60 * 60 * 24) : 0;

    // HD if released more than 45 days ago, otherwise indicate CAM for very recent movies (assuming theater release window)
    // TV shows are usually HD immediately upon digital air date
    let quality = 'HD';
    let qualityColor = 'bg-green-500/20 text-green-400 border-green-500/30';

    if (type === 'movie') {
        if (!isReleased) {
            quality = 'Coming Soon';
            qualityColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        } else if (daysSinceRelease <= 15) {
            quality = 'CAM';
            qualityColor = 'bg-red-500/20 text-red-400 border-red-500/30';
        }
    }

    return (
        <Link to={`/${type}/${item.id}`} className={cn("block group", className)}>
            <Card className="border-0 bg-transparent shadow-none overflow-visible">
                <CardContent className="p-0 relative">
                    {/* Image Container */}
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-orange-500/20 group-hover:-translate-y-2">
                        <OptimizedImage
                            src={getPosterUrl(item.poster_path)}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                            <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75 shadow-lg shadow-orange-600/50">
                                <Play className="w-6 h-6 text-white fill-current ml-1" />
                            </div>
                        </div>

                        {/* Top Badge (Rating) */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            <Badge variant="glass" className="font-bold flex items-center gap-1 text-yellow-500">
                                <Star className="w-3 h-3 fill-current" /> {rating}
                            </Badge>
                        </div>

                        {/* Quality Badge - Always visible or on hover? User wants quality indicator. 
                             Let's keep it visible or switch with type badge on hover. 
                             Design choice: Quality badge top left, always visible if it's CAM or High value info. 
                         */}
                        <div className="absolute top-2 left-2 flex gap-1">
                            <Badge variant="outline" className={cn("uppercase text-[10px] tracking-wider font-bold backdrop-blur-md", qualityColor)}>
                                {quality}
                            </Badge>
                        </div>
                    </div>

                    {/* Content Below */}
                    <div className="pt-3 space-y-1">
                        <h3 className="font-bold text-white text-base truncate pr-2 group-hover:text-orange-500 transition-colors duration-300">
                            {title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-gray-400 transition-colors">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {year}
                            </span>
                            <span className="uppercase text-[10px] border border-white/10 px-1 rounded">
                                {type}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
