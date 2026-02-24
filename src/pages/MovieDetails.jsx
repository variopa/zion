import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';
import AdBanner from '@/components/ui/AdBanner';
import OptimizedImage from '@/components/ui/OptimizedImage';
import MovieRow from '@/components/ui/MovieRow';
import TrailerModal from '@/components/ui/TrailerModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    getMovieDetails,
    getMovieCredits,
    getSimilarMovies,
    getMovieVideos,
    getMovieKeywords,
    getMovieReviews,
    getBackdropUrl,
    getPosterUrl,
    formatRuntime,
    formatDate,
    getTrailerUrl
} from '@/lib/tmdb';
import { Loader2, Play, Star, Calendar, Clock, Video, Share2, Info } from 'lucide-react';

export default function MovieDetails() {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [credits, setCredits] = useState(null);
    const [similar, setSimilar] = useState([]);
    const [trailerUrl, setTrailerUrl] = useState(null);
    const [keywords, setKeywords] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    // Track Analytics
    usePlatformMetrics(movie?.title);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [movieData, creditsData, similarData, videosData, keywordsData, reviewsData] = await Promise.all([
                    getMovieDetails(id),
                    getMovieCredits(id),
                    getSimilarMovies(id),
                    getMovieVideos(id),
                    getMovieKeywords(id),
                    getMovieReviews(id)
                ]);

                setMovie(movieData);
                setCredits(creditsData);
                setSimilar(similarData.results || []);
                setTrailerUrl(getTrailerUrl(videosData));
                setKeywords(keywordsData.keywords || []);
                setReviews(reviewsData.results?.slice(0, 2) || []);
            } catch (error) {
                console.error('Error fetching movie details:', error);
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

    if (!movie) return null;

    const cast = credits?.cast?.slice(0, 10) || [];
    const director = credits?.crew?.find(person => person.job === 'Director');

    return (
        <main className="min-h-screen bg-background pb-20">

            {/* Cinematic Backdrop */}
            <div className="relative h-[85vh] w-full overflow-hidden">
                <div className="absolute inset-0">
                    <OptimizedImage
                        src={getBackdropUrl(movie.backdrop_path)}
                        alt={movie.title}
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
                                        src={getPosterUrl(movie.poster_path)}
                                        alt={movie.title}
                                        className="w-full aspect-[2/3] object-cover"
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Info Section */}
                        <div className="space-y-6 animate-slide-up">
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-2xl leading-[0.9]">
                                    {movie.title}
                                </h1>
                                <p className="text-xl md:text-2xl text-gray-300 font-light max-w-2xl">
                                    {movie.tagline}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 px-3 py-1 text-sm">
                                    <Star className="w-4 h-4 mr-1 fill-current" /> {movie.vote_average?.toFixed(1)}
                                </Badge>
                                <Separator orientation="vertical" className="h-6 bg-white/20" />
                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                    <Calendar className="w-4 h-4" /> {formatDate(movie.release_date)}
                                </div>
                                <Separator orientation="vertical" className="h-6 bg-white/20" />
                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                    <Clock className="w-4 h-4" /> {formatRuntime(movie.runtime)}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {movie.genres?.map(genre => (
                                    <Badge key={genre.id} variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                                        {genre.name}
                                    </Badge>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link to={`/watch/movie/${id}`}>
                                    <Button size="lg" className="rounded-full px-8 py-6 text-lg font-bold bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/25">
                                        <Play className="w-6 h-6 mr-2 fill-current" />
                                        Watch Movie
                                    </Button>
                                </Link>

                                {movie.id && (
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Content */}
            <div className="container mx-auto px-6 lg:px-12 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12 lg:gap-24">
                    {/* Main Content */}
                    <div className="space-y-12">
                        <section>
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Info className="w-6 h-6 text-orange-500" />
                                Overview
                            </h3>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                {movie.overview}
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
                                    <h4 className="text-sm font-uppercase tracking-widest text-gray-500 mb-2">Original Title</h4>
                                    <p className="text-white font-medium">{movie.original_title}</p>
                                </div>
                                <Separator className="bg-white/10" />
                                <div>
                                    <h4 className="text-sm font-uppercase tracking-widest text-gray-500 mb-2">Status</h4>
                                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                        {movie.status}
                                    </Badge>
                                </div>
                                <Separator className="bg-white/10" />
                                {director && (
                                    <div>
                                        <h4 className="text-sm font-uppercase tracking-widest text-gray-500 mb-2">Director</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden">
                                                <OptimizedImage src={getPosterUrl(director.profile_path)} className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-white font-bold">{director.name}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* SEO Value: Visible Keywords */}
                    {keywords.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {keywords.map(keyword => (
                                    <Link key={keyword.id} to={`/search?q=${encodeURIComponent(keyword.name)}`}>
                                        <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 cursor-pointer transition-colors">
                                            #{keyword.name}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SEO Content: User Reviews */}
            {reviews.length > 0 && (
                <div className="container mx-auto px-6 lg:px-12 py-12 border-t border-white/5">
                    <h3 className="text-2xl font-bold text-white mb-8">User Reviews</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        {reviews.slice(0, 2).map(review => (
                            <Card key={review.id} className="bg-white/5 border-white/10">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold uppercase">
                                                {review.author[0]}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold">{review.author}</h4>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                                                    {review.author_details?.rating ? `${review.author_details.rating}/10` : 'Rated'}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
                                        {review.content}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            {/* Ad Placement */}
            <div className="container mx-auto px-6 lg:px-12 py-8">
                <AdBanner />
            </div>

            {/* Similar Movies */}
            <div className="mt-12">
                <MovieRow title="More Like This" items={similar} type="movie" />
            </div>

            <TrailerModal
                isOpen={isTrailerOpen}
                onClose={() => setIsTrailerOpen(false)}
                movieId={id}
                movieTitle={movie.title}
                mediaType="movie"
            />
        </main>
    );
}
