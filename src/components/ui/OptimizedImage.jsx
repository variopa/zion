import { useState, useEffect, useRef } from 'react';

export default function OptimizedImage({
    src,
    alt,
    className = '',
    width,
    height,
    priority = false,
    sizes = '100vw',
    fallbackSrc = '/placeholder-movie.jpg',
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority || !imgRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before image enters viewport
            }
        );

        observer.observe(imgRef.current);

        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, [priority]);

    // Generate responsive srcset for TMDB images
    const generateSrcSet = (imageSrc) => {
        if (!imageSrc || !imageSrc.includes('image.tmdb.org')) {
            return '';
        }

        const pathMatch = imageSrc.match(/\/t\/p\/\w+(\/.+)/);
        if (!pathMatch) return '';

        const imagePath = pathMatch[1];
        const baseUrl = 'https://image.tmdb.org/t/p';

        return `
            ${baseUrl}/w300${imagePath} 300w,
            ${baseUrl}/w500${imagePath} 500w,
            ${baseUrl}/w780${imagePath} 780w,
            ${baseUrl}/original${imagePath} 1280w
        `.trim();
    };

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    const imageSrc = hasError ? fallbackSrc : src;
    const srcSet = generateSrcSet(src);

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
            style={{ width, height }}
        >
            {/* Loading skeleton */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse" />
            )}

            {/* Actual image */}
            {isInView && (
                <img
                    src={imageSrc}
                    srcSet={srcSet || undefined}
                    sizes={sizes}
                    alt={alt}
                    width={width}
                    height={height}
                    loading={priority ? 'eager' : 'lazy'}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`
                        w-full h-full object-cover transition-opacity duration-300
                        ${isLoaded ? 'opacity-100' : 'opacity-0'}
                    `}
                />
            )}
        </div>
    );
}
