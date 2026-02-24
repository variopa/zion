import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Monitor, Smartphone, Tablet, Clock, Loader2, Globe, MonitorPlay } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, subMinutes } from 'date-fns';

export default function AdminLive() {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                // Active in the last 2 minutes
                const activeThreshold = subMinutes(new Date(), 2).toISOString();

                const { data, error } = await supabase
                    .from('active_presence')
                    .select('*')
                    .gte('last_heartbeat', activeThreshold)
                    .order('last_heartbeat', { ascending: false });

                if (error) {
                    console.error('Error fetching live presence:', error);
                    return;
                }

                setSessions(data || []);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSessions();

        // Poll every 10 seconds for real-time feel
        const interval = setInterval(fetchSessions, 10000);
        return () => clearInterval(interval);
    }, []);

    const getDeviceIcon = (type) => {
        switch (type) {
            case 'Mobile': return <Smartphone className="w-5 h-5 text-orange-500" />;
            case 'Tablet': return <Tablet className="w-5 h-5 text-[#ff6700]" />;
            default: return <Monitor className="w-5 h-5 text-[#ff6700]" />;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black text-white tracking-tight">Live Pulse</h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_#ff6700]"></div>
                        <span className="text-xs font-bold text-orange-500 tracking-wider uppercase">{sessions.length} ACTIVE</span>
                    </div>
                </div>
                <p className="text-white/60 font-medium mt-1">Real-time view of platform pulse and activity.</p>
            </div>

            {isLoading ? (
                <div className="h-[40vh] flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#ff6700]" />
                </div>
            ) : sessions.length === 0 ? (
                <div className="clay-card p-12 flex flex-col items-center justify-center text-center">
                    <Activity className="w-16 h-16 text-[#94a3b8] mb-4 opacity-50" />
                    <h2 className="text-xl font-bold text-[#64748b]">No active watchers</h2>
                    <p className="text-[#94a3b8] mt-2 max-w-sm">There are currently no users streaming content on the platform right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sessions.map((session) => (
                        <motion.div
                            layout
                            key={session.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel p-6 border border-white/10 relative overflow-hidden group hover:neon-orange transition-all duration-300"
                        >
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center justify-center font-black text-orange-500">
                                    {getDeviceIcon(session.device_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate">
                                        {session.movie_title || 'Browsing Catalog'}
                                    </p>
                                    <p className="text-[10px] font-bold text-white/40 tracking-wider uppercase">
                                        {session.current_path.includes('/tv/') ? 'TV Series' : 'Movie'}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6 relative z-10">
                                <div className="flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/50">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs font-bold text-[#1e293b]">
                                        {session.region_info?.city || 'Unknown'}, {session.region_info?.country || 'Global'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-white/40 relative z-10">
                                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                                    {formatDistanceToNow(new Date(session.last_heartbeat))} AGO
                                </span>
                                <span className="uppercase tracking-widest">{session.device_type}</span>
                            </div>

                            {/* Decorative Background Element */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tl from-orange-500/5 to-transparent rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors z-0 pointer-events-none"></div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
