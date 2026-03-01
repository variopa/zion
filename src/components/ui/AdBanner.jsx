import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function AdBanner({ className = '' }) {
    const [ad, setAd] = useState(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchActiveAd = async () => {
            try {
                const now = new Date().toISOString();

                const { data, error } = await supabase
                    .from('ad_campaigns')
                    .select('*, ad_creatives(*)')
                    .eq('status', 'active')
                    .lte('start_date', now)
                    .gte('end_date', now)
                    .order('created_at', { ascending: false });

                if (error) {
                    // Only log real database errors, skip transient fetch failures to keep console clean
                    if (error.message !== 'Failed to fetch') {
                        console.error('Ad System:', error.message);
                    }
                    return;
                }

                if (data && data.length > 0) {
                    // Pick a random campaign, then a random creative from it
                    const campaign = data[Math.floor(Math.random() * data.length)];
                    const creatives = campaign.ad_creatives;
                    if (creatives && creatives.length > 0) {
                        const randomCreative = creatives[Math.floor(Math.random() * creatives.length)];
                        setAd(randomCreative);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch ad:', err);
            }
        };

        fetchActiveAd();

        // Optional: Poll every minute to check if ad schedule changed
        const interval = setInterval(fetchActiveAd, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!ad || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`relative w-full max-w-[1920px] mx-auto overflow-hidden shadow-2xl shadow-black/50 group border border-white/5 bg-white/5 backdrop-blur-sm aspect-[3/1] md:aspect-[4.8/1] ${className}`}
            >
                {/* Close Button - Appears on Hover */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Close Advertisement"
                >
                    <X className="w-4 h-4" />
                </button>

                <a
                    href={ad.destination_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full h-full items-center justify-center bg-black/20"
                    onClick={() => {
                        // Track click in background
                        if (ad.id) {
                            supabase.from('ad_creatives')
                                .update({ click_count: (ad.click_count || 0) + 1 })
                                .eq('id', ad.id)
                                .then(() => { });
                        }
                    }}
                >
                    {/* Sponsored Tag */}
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] font-medium text-white/70 uppercase tracking-widest border border-white/10">
                        Sponsored
                    </div>

                    {/* Mobile Image */}
                    <img
                        src={ad.mobile_image_url}
                        alt="Advertisement"
                        className="w-full h-full object-cover md:hidden"
                        loading="lazy"
                    />

                    {/* Desktop Image */}
                    <img
                        src={ad.desktop_image_url}
                        alt="Advertisement"
                        className="hidden md:block w-full h-full object-cover"
                        loading="lazy"
                    />
                </a>
            </motion.div>
        </AnimatePresence>
    );
}
