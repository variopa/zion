import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import OptimizedImage from '@/components/ui/OptimizedImage';
import MovieRow from '@/components/ui/MovieRow';
import TrailerModal from '@/components/ui/TrailerModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdBanner from '@/components/ui/AdBanner';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    getTVShowDetails,
    getTVShowCredits,
    getSimilarTVShows,
    getTVKeywords,
    getTVReviews,
    getBackdropUrl,
    getPosterUrl,
    formatDate
} from '@/lib/tmdb';
import { Loader2, Play, Star, Calendar, Layers, Info, Share2, Video } from 'lucide-react';
import SEO from '@/components/SEO';

export default function TVDetails() {
    const { id } = useParams();
    const [tv, setTv] = useState(null);

    // Track Analytics
    usePlatformMetrics(tv?.name);
    const [credits, setCredits] = useState(null);
    const [similar, setSimilar] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [tvData, creditsData, similarData, keywordsData, reviewsData] = await Promise.all([
                    getTVShowDetails(id),
                    getTVShowCredits(id),
                    getSimilarTVShows(id),
                    getTVKeywords(id),
                    getTVReviews(id)
                ]);

                setTv(tvData);
                setCredits(creditsData);
                setSimilar(similarData.results || []);
                setKeywords(keywordsData.results || []);
                setReviews(reviewsData.results?.slice(0, 2) || []);
            } catch (error) {
                console.error('Error fetching TV details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!tv) return null;

    const cast = credits?.cast?.slice(0, 10) || [];
    const creators = tv.created_by || [];

    return (
        <main className="min-h-screen bg-background pb-20">
            <SEO
                title={tv.name}
                description={tv.overview}
                image={`https://image.tmdb.org/t/p/w1280${tv.backdrop_path}`}
                url={`https://zionmovies.pro.et/tv/${id}`}
                type="video.tv_show"
                movieData={{
                    title: tv.name,
                    overview: tv.overview,
                    poster_path: tv.poster_path,
                    release_date: tv.first_air_date,
                    vote_average: tv.vote_average,
                    vote_count: tv.vote_count
                }}
            />

            {/* Cinematic Backdrop */}
            <div className="relative h-[85vh] w-full overflow-hidden">
                <div className="absolute inset-0">
                    <OptimizedImage
                        src={getBackdropUrl(tv.backdrop_path)}
                        alt={tv.name}
                        className="absolute inset-0 scale-105 animate-in fade-in duration-1000"
                        priority={true}
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent"></div>
                </div>

                <div className="relative h-full container mx-auto px-6 lg:px-12 flex items-end pb-16 lg:pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-end w-full">
                        {/* Poster Card */}
                        <div className="hidden lg:block">
                            <Card className="border-0 bg-transparent shadow-2xl shadow-black/50 overflow-hidden rounded-2xl">
                                <CardContent className="p-0">
                                    <OptimizedImage
                                        src={getPosterUrl(tv.poster_path)}
                                        alt={tv.name}
                                        className="w-full aspect-[2/3] object-cover"
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Info Section */}
                        <div className="space-y-6 animate-slide-up">
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-2xl leading-[0.9]">
                                    {tv.name}
                                </h1>
                                <p className="text-xl md:text-2xl text-gray-300 font-light max-w-2xl">
                                    {tv.tagline || 'TV Series'}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1 text-sm font-bold">
                                    <Star className="w-4 h-4 mr-1 fill-current" /> {tv.vote_average?.toFixed(1)}
                                </Badge>
                                <Separator orientation="vertical" className="h-6 bg-white/20" />
                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                    <Calendar className="w-4 h-4" /> {formatDate(tv.first_air_date)}
                                </div>
                                <Separator orientation="vertical" className="h-6 bg-white/20" />
                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                    <Layers className="w-4 h-4" /> {tv.number_of_seasons} Seasons
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {tv.genres?.map(genre => (
                                    <Badge key={genre.id} variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                                        {genre.name}
                                    </Badge>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link to={`/watch/tv/${id}`}>
                                    <Button size="lg" className="rounded-full px-8 py-6 text-lg font-bold bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/25">
                                        <Play className="w-6 h-6 mr-2 fill-current" />
                                        Watch Now
                                    </Button>
                                </Link>
                                {tv.id && (
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="rounded-full px-8 py-6 text-lg font-bold border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white"
                                        onClick={() => setIsTrailerOpen(true)}
                                    >
                                        <Video className="w-6 h-6 mr-2" />
                                        Trailer
                                    </Button>
                                )}
                                <Button size="lg" variant="ghost" className="rounded-full px-6 py-6 text-gray-300 hover:text-white hover:bg-white/5">
                                    <Share2 className="w-6 h-6 mr-2" />
                                    Share
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Content */}
            <div className="container mx-auto px-6 lg:px-12 py-12">
                <AdBanner className="mb-12" />

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12 lg:gap-24">
                    {/* Main Content */}
                    <div className="space-y-12">
                        <section>
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Info className="w-6 h-6 text-orange-500" />
                                Overview
                            </h3>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                {tv.overview}
                            </p>
                        </section>

                        <section>
                            <h3 className="text-2xl font-bold text-white mb-6">Top Cast</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                {cast.map(person => (
                                    <div key={person.id} className="flex items-center gap-4 group">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                            <OptimizedImage
                                                src={getPosterUrl(person.profile_path)}
                                                alt={person.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-orange-400 transition-colors">{person.name}</h4>
                                            <p className="text-xs text-gray-500">{person.character}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-sm font-uppercase tracking-widest text-gray-500 mb-2">Original Name</h4>
                                    <p className="text-white font-medium">{tv.original_name}</p>
                                </div>
                                <Separator className="bg-white/10" />
                                <div>
                                    <h4 className="text-sm font-uppercase tracking-widest text-gray-500 mb-2">Status</h4>
                                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                        {tv.status}
                                    </Badge>
                                </div>
                                <Separator className="bg-white/10" />
                                <div>
                                    <h4 className="text-sm font-uppercase tracking-widest text-gray-500 mb-2">Episodes</h4>
                                    <p className="text-white font-medium">{tv.number_of_episodes} Episodes</p>
                                </div>
                                <Separator className="bg-white/10" />
                                {creators.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-uppercase tracking-widest text-gray-500 mb-2">Creators</h4>
                                        <div className="space-y-2">
                                            {creators.map(creator => (
                                                <p key={creator.id} className="text-white font-bold">{creator.name}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Similar Shows */}
                <div className="mt-24">
                    <MovieRow title="More Like This" items={similar} type="tv" />
                </div>
            </div>

            <TrailerModal
                isOpen={isTrailerOpen}
                onClose={() => setIsTrailerOpen(false)}
                movieId={id}
                movieTitle={tv.name}
                mediaType="tv"
            />
        </main>
    );
}
