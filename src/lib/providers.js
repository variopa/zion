// EmbedMaster (Primary - Server 1)
export const getEmbedMasterUrl = (tmdbId, season, episode) => {
    const base = season && episode
        ? `https://embedmaster.link/tv/${tmdbId}/${season}/${episode}`
        : `https://embedmaster.link/movie/${tmdbId}`;
    return `${base}?js=1&controls=0`;
};

// VidSrc.me (Server 2 - Original)
export const getVidSrcMeUrl = (tmdbId, season, episode) => {
    const base = season && episode
        ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
        : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
    return `${base}&js=1`;
};

// VidLink (Server 3 - Modern)
export const getVidLinkUrl = (tmdbId, season, episode) => {
    const base = season && episode
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
        : `https://vidlink.pro/movie/${tmdbId}`;
    return `${base}?js=1&controls=0`;
};

export const PROVIDERS = [
    {
        id: 'embedmaster',
        name: 'Server 1 (Fast)',
        getUrl: getEmbedMasterUrl,
        note: 'Primary - No Ads',
        recommended: true,
        quality: 'high',
        ads: 'none'
    },
    {
        id: 'vidsrc_me',
        name: 'Server 2 (Backup)',
        getUrl: getVidSrcMeUrl,
        note: 'Original Server',
        quality: 'high',
        ads: 'medium'
    },
    {
        id: 'vidlink',
        name: 'Server 3 (HD)',
        getUrl: getVidLinkUrl,
        note: 'Modern Player',
        quality: 'HD',
        ads: 'low'
    }
];
