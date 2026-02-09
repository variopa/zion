export const useAnalytics = () => {
    return {
        trackSearch: (query) => console.log('Track Search:', query),
        trackTrailerClick: (id, name, source) => console.log('Track Trailer:', id, name, source),
        trackTrailerView: (id, name) => console.log('Track Trailer View:', id, name),
        trackHeroWatchClick: (id, type, name) => console.log('Track Watch:', id, type, name),
        trackProviderSwitch: (id, name) => console.log('Provider Switch:', id, name),
        trackEpisodeSelect: (id, name, season, episode) => console.log('Episode Select:', id, name, season, episode),
        trackContentPlay: (id, type, name) => console.log('Content Play:', id, type, name),
    };
};
