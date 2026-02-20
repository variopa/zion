// VidSrc.cc (Primary - Server 1)
export const getVidSrcCCUrl = (tmdbId, season, episode) => {
    const base = season && episode
        ? `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
    return base;
};

// EmbedMaster (Server 2)
export const getEmbedMasterUrl = (tmdbId, season, episode) => {
    const base = season && episode
        ? `https://embedmaster.link/tv/${tmdbId}/${season}/${episode}`
        : `https://embedmaster.link/movie/${tmdbId}`;
    return `${base}?js=1&controls=0`;
};

export const PROVIDERS = [
    {
        id: 'vidsrc_cc',
        name: 'Server 1',
        getUrl: getVidSrcCCUrl,
        note: 'High Speed - Secure',
        recommended: true,
        quality: 'HD',
        ads: 'low'
    },
    {
        id: 'embedmaster',
        name: 'Server 2',
        getUrl: getEmbedMasterUrl,
        note: 'Secondary - Adblock Recommended',
        quality: 'high',
        ads: 'none'
    }
];
