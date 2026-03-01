import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for ZION Movies
 * Handles dynamic meta tags, social sharing cards, and structured data.
 */
export default function SEO({
    title,
    description,
    image = 'https://zionmovies.pro.et/og-image.jpg',
    url = 'https://zionmovies.pro.et',
    type = 'website',
    movieData = null // Optional: for Movie structured data
}) {
    const siteName = 'ZION Movies';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const siteDescription = description || "Watch the latest movies and TV shows online for free on ZION. The ultimate destination for HD streaming with no registration.";

    // Core keywords optimized for "ZION Movies" and "zionmovies"
    const keywords = "zion movies, zionmovies, zion stream, watch movies free, zionmovies.pro.et, free hd movies, stream movies online, zION high quality movies";

    // Structured Data (JSON-LD)
    const structuredData = movieData ? {
        "@context": "https://schema.org",
        "@type": "Movie",
        "name": movieData.title,
        "description": movieData.overview,
        "image": `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
        "datePublished": movieData.release_date,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": movieData.vote_average,
            "bestRating": "10",
            "ratingCount": movieData.vote_count
        }
    } : {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": siteName,
        "url": url,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${url}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={siteDescription} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={siteDescription} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={siteDescription} />
            <meta name="twitter:image" content={image} />

            {/* JSON-LD Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>
        </Helmet>
    );
}
