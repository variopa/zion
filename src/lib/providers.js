// EmbedMaster (Primary - Server 1)
export const getEmbedMasterUrl = (tmdbId, season, episode) => {
    if (season && episode) {
        return `https://embedmaster.link/tv/${tmdbId}/${season}/${episode}`;
    }
    return `https://embedmaster.link/movie/${tmdbId}`;
};

// VidSrc.me (Server 2 - Original)
export const getVidSrcMeUrl = (tmdbId, season, episode) => {
    if (season && episode) {
        return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
    }
    return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
};

// VidLink (Server 3 - Modern)
export const getVidLinkUrl = (tmdbId, season, episode) => {
    if (season && episode) {
        return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
    }
    return `https://vidlink.pro/movie/${tmdbId}`;
};

export const PROVIDERS = [
    {
        id: 'embedmaster',
        name: 'Server 1 (EmbedMaster)',
        getUrl: getEmbedMasterUrl,
        note: 'Primary - No Ads',
        recommended: true,
        quality: 'high',
        ads: 'none'
    },
    {
        id: 'vidsrc_me',
        name: 'Server 2 (VidSrc.me)',
        getUrl: getVidSrcMeUrl,
        note: 'Original Server',
        quality: 'high',
        ads: 'medium'
    },
    {
        id: 'vidlink',
        name: 'Server 3 (VidLink)',
        getUrl: getVidLinkUrl,
        note: 'Modern Player',
        quality: 'HD',
        ads: 'low'
    }
];
