import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
    BarChart3, Users, Eye, Film, Monitor, Smartphone, Tablet,
    Globe, MapPin, Activity, AlertTriangle, Loader2, TrendingUp, Clock
} from 'lucide-react';

// Simple bar chart component (no external dependency needed)
function MiniBarChart({ data, labelKey, valueKey, maxBars = 10, color = '#ff6700' }) {
    if (!data || data.length === 0) return <EmptyState label="No data yet" />;
    const sorted = [...data].sort((a, b) => b[valueKey] - a[valueKey]).slice(0, maxBars);
    const max = Math.max(...sorted.map(d => d[valueKey]));
    return (
        <div className="space-y-3">
            {sorted.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white/60 w-32 truncate" title={item[labelKey]}>
                        {item[labelKey] || 'Unknown'}
                    </span>
                    <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${max > 0 ? (item[valueKey] / max) * 100 : 0}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                        />
                    </div>
                    <span className="text-sm font-black text-white/80 w-12 text-right">{item[valueKey].toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ label }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-white/30">
            <BarChart3 className="w-10 h-10 mb-3" />
            <p className="text-sm font-bold">{label}</p>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, subtext, color = 'orange' }) {
    const colorMap = {
        orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20',
        blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
        green: 'from-green-500/20 to-green-600/5 border-green-500/20',
        purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
    };
    const iconColorMap = {
        orange: 'text-orange-500',
        blue: 'text-blue-500',
        green: 'text-green-500',
        purple: 'text-purple-500',
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl bg-gradient-to-br ${colorMap[color]} border backdrop-blur-sm`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest">{label}</p>
                    <p className="text-3xl font-black text-white mt-2">{value}</p>
                    {subtext && <p className="text-xs text-white/50 mt-1 font-medium">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-xl bg-white/5 ${iconColorMap[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </motion.div>
    );
}

export default function AdminAnalytics() {
    const { userRole } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Core stats
    const [uniqueDevices, setUniqueDevices] = useState(0);
    const [liveWatchers, setLiveWatchers] = useState(0);
    const [uniqueMovies, setUniqueMovies] = useState(0);
    const [totalViews, setTotalViews] = useState(0);

    // Chart data
    const [topMovies, setTopMovies] = useState([]);
    const [deviceBreakdown, setDeviceBreakdown] = useState([]);
    const [topCountries, setTopCountries] = useState([]);
    const [topCities, setTopCities] = useState([]);
    const [dailyTraffic, setDailyTraffic] = useState([]);
    const [topPages, setTopPages] = useState([]);

    // Superadmin system stats
    const [totalDbRows, setTotalDbRows] = useState(0);
    const [adminCount, setAdminCount] = useState(0);

    useEffect(() => {
        fetchAllAnalytics();
    }, []);

    const fetchAllAnalytics = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch all traffic logs (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: trafficData, error: trafficError } = await supabase
                .from('site_traffic_logs')
                .select('session_id, path, movie_title, device_type, region_info, created_at')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            if (trafficError) {
                console.error('Traffic fetch error:', trafficError);
                setError(`Failed to load analytics: ${trafficError.message}. This may be an RLS policy issue — ensure your profile has admin/superadmin role.`);
                setLoading(false);
                return;
            }

            const rows = trafficData || [];

            // 2. Calculate stats from returned data
            const uniqueSessions = new Set(rows.map(r => r.session_id));
            setUniqueDevices(uniqueSessions.size);
            setTotalViews(rows.length);

            const moviesWatched = new Set(rows.filter(r => r.movie_title).map(r => r.movie_title));
            setUniqueMovies(moviesWatched.size);

            // 3. Top Movies (by unique devices that viewed details/watch pages)
            const movieCounts = {};
            rows.forEach(r => {
                if (r.movie_title) {
                    if (!movieCounts[r.movie_title]) movieCounts[r.movie_title] = new Set();
                    movieCounts[r.movie_title].add(r.session_id);
                }
            });
            const topMoviesArr = Object.entries(movieCounts)
                .map(([title, sessions]) => ({ title, viewers: sessions.size }))
                .sort((a, b) => b.viewers - a.viewers)
                .slice(0, 10);
            setTopMovies(topMoviesArr);

            // 4. Device breakdown (unique sessions per device)
            const deviceCounts = {};
            rows.forEach(r => {
                const device = r.device_type || 'Unknown';
                if (!deviceCounts[device]) deviceCounts[device] = new Set();
                deviceCounts[device].add(r.session_id);
            });
            const deviceArr = Object.entries(deviceCounts)
                .map(([device, sessions]) => ({ device, count: sessions.size }));
            setDeviceBreakdown(deviceArr);

            // 5. Top Countries (from region_info JSONB)
            const countryCounts = {};
            const cityCounts = {};
            rows.forEach(r => {
                if (r.region_info) {
                    const country = r.region_info.country || 'Unknown';
                    const city = r.region_info.city || 'Unknown';
                    if (!countryCounts[country]) countryCounts[country] = new Set();
                    countryCounts[country].add(r.session_id);
                    if (!cityCounts[city]) cityCounts[city] = new Set();
                    cityCounts[city].add(r.session_id);
                }
            });
            setTopCountries(Object.entries(countryCounts).map(([country, s]) => ({ country, count: s.size })).sort((a, b) => b.count - a.count).slice(0, 10));
            setTopCities(Object.entries(cityCounts).map(([city, s]) => ({ city, count: s.size })).sort((a, b) => b.count - a.count).slice(0, 10));

            // 6. Daily traffic (unique sessions per day)
            const dailyCounts = {};
            rows.forEach(r => {
                const day = r.created_at.split('T')[0];
                if (!dailyCounts[day]) dailyCounts[day] = new Set();
                dailyCounts[day].add(r.session_id);
            });
            const dailyArr = Object.entries(dailyCounts)
                .map(([date, sessions]) => ({ date, count: sessions.size }))
                .sort((a, b) => a.date.localeCompare(b.date));
            setDailyTraffic(dailyArr);

            // 7. Top Pages
            const pageCounts = {};
            rows.forEach(r => {
                if (!pageCounts[r.path]) pageCounts[r.path] = new Set();
                pageCounts[r.path].add(r.session_id);
            });
            setTopPages(Object.entries(pageCounts).map(([path, s]) => ({ path, count: s.size })).sort((a, b) => b.count - a.count).slice(0, 10));

            // 8. Live watchers (from active_presence)
            const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
            const { data: liveData } = await supabase
                .from('active_presence')
                .select('session_id')
                .gte('last_heartbeat', twoMinAgo);
            setLiveWatchers(liveData?.length || 0);

            // 9. Superadmin system stats
            if (userRole === 'superadmin') {
                setTotalDbRows(rows.length);
                const { data: admins } = await supabase.from('profiles').select('id').in('role', ['superadmin', 'admin']);
                setAdminCount(admins?.length || 0);
            }

        } catch (err) {
            console.error('Analytics error:', err);
            setError(`Unexpected error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePurgeData = async () => {
        if (!window.confirm('WARNING: This will permanently delete ALL analytics and tracking data older than 30 days. This action cannot be undone. Proceed?')) {
            return;
        }

        setLoading(true);
        try {
            const { data, error: purgeError } = await supabase.rpc('purge_old_analytics');
            if (purgeError) throw purgeError;

            alert(`Cleanup successful!\n\n${data.message}\n- Purged Traffic: ${data.purged_traffic}\n- Purged Chatbot: ${data.purged_chatbot}\n- Purged Presence: ${data.purged_presence}`);

            // Refresh data to reflect changes
            await fetchAllAnalytics();
        } catch (err) {
            console.error('Purge error:', err);
            setError(`Maintenance failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#ff6700]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">
                        {userRole === 'superadmin' ? 'Command Center' : userRole === 'admin' ? 'Analytics Dashboard' : 'Overview'}
                    </h1>
                    <p className="text-white/40 font-medium mt-1">
                        Last 30 days · Unique device tracking · Anti-spam enforced
                    </p>
                </div>
                <button
                    onClick={fetchAllAnalytics}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold text-sm"
                >
                    <TrendingUp className="w-4 h-4" />
                    Refresh Data
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-red-400 text-sm">Data Sync Error</p>
                        <p className="text-red-400/70 text-xs mt-1">{error}</p>
                    </div>
                </motion.div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Unique Devices" value={uniqueDevices.toLocaleString()} subtext="30-day unique sessions" color="orange" />
                <StatCard icon={Activity} label="Live Now" value={liveWatchers} subtext="Active watchers" color="green" />
                <StatCard icon={Film} label="Movies Watched" value={uniqueMovies} subtext="Unique titles" color="blue" />
                <StatCard icon={Eye} label="Total Page Views" value={totalViews.toLocaleString()} subtext="All tracked events" color="purple" />
            </div>

            {/* Superadmin System Health & Maintenance */}
            {userRole === 'superadmin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20"
                    >
                        <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            System Health (Superadmin Only)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-2xl font-black text-white">{totalDbRows.toLocaleString()}</p>
                                <p className="text-xs text-white/40 font-medium">DB Rows (30d)</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{adminCount}</p>
                                <p className="text-xs text-white/40 font-medium">Active Admins</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{topMovies.length}</p>
                                <p className="text-xs text-white/40 font-medium">Tracked Titles</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{topCountries.length}</p>
                                <p className="text-xs text-white/40 font-medium">Countries Reached</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 flex flex-col justify-between"
                    >
                        <div>
                            <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Maintenance
                            </h3>
                            <p className="text-xs text-white/40 font-medium mb-4">Keep database lean by purging old data</p>
                        </div>
                        <button
                            onClick={handlePurgeData}
                            className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/10"
                        >
                            Purge Data &gt; 30 Days
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Daily Traffic Chart */}
            <div className="glass-panel p-6 border border-white/10">
                <h3 className="text-sm font-black text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    Daily Unique Visitors
                </h3>
                {dailyTraffic.length > 0 ? (
                    <div className="flex items-end gap-1 h-40">
                        {dailyTraffic.map((day, i) => {
                            const max = Math.max(...dailyTraffic.map(d => d.count));
                            const height = max > 0 ? (day.count / max) * 100 : 0;
                            return (
                                <motion.div
                                    key={day.date}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.02 }}
                                    className="flex-1 bg-gradient-to-t from-orange-500 to-orange-500/30 rounded-t-md min-w-[4px] group relative cursor-default"
                                    title={`${day.date}: ${day.count} unique visitors`}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap font-bold pointer-events-none">
                                        {day.date.slice(5)}: {day.count}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState label="No traffic data yet — visit the public site to generate data" />
                )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Movies */}
                <div className="glass-panel p-6 border border-white/10">
                    <h3 className="text-sm font-black text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Film className="w-4 h-4 text-blue-500" />
                        Most Viewed Movies (Unique Viewers)
                    </h3>
                    <MiniBarChart data={topMovies} labelKey="title" valueKey="viewers" color="#3b82f6" />
                </div>

                {/* Top Pages */}
                <div className="glass-panel p-6 border border-white/10">
                    <h3 className="text-sm font-black text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-green-500" />
                        Most Visited Pages
                    </h3>
                    <MiniBarChart data={topPages} labelKey="path" valueKey="count" color="#22c55e" />
                </div>

                {/* Device Breakdown */}
                <div className="glass-panel p-6 border border-white/10">
                    <h3 className="text-sm font-black text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-orange-500" />
                        Device Distribution
                    </h3>
                    {deviceBreakdown.length > 0 ? (
                        <div className="space-y-4">
                            {deviceBreakdown.map((d) => {
                                const total = deviceBreakdown.reduce((acc, x) => acc + x.count, 0);
                                const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0;
                                const DeviceIcon = d.device === 'Mobile' ? Smartphone : d.device === 'Tablet' ? Tablet : Monitor;
                                return (
                                    <div key={d.device} className="flex items-center gap-4">
                                        <DeviceIcon className="w-5 h-5 text-white/40" />
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-bold text-white/80">{d.device}</span>
                                                <span className="text-sm font-black text-white/60">{pct}%</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8 }}
                                                    className="h-full bg-orange-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-white/40 w-8 text-right">{d.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState label="No device data yet" />
                    )}
                </div>

                {/* Top Countries */}
                <div className="glass-panel p-6 border border-white/10">
                    <h3 className="text-sm font-black text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-purple-500" />
                        Top Countries
                    </h3>
                    <MiniBarChart data={topCountries} labelKey="country" valueKey="count" color="#a855f7" />
                </div>

                {/* Top Cities */}
                <div className="glass-panel p-6 border border-white/10">
                    <h3 className="text-sm font-black text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-pink-500" />
                        Top Cities
                    </h3>
                    <MiniBarChart data={topCities} labelKey="city" valueKey="count" color="#ec4899" />
                </div>
            </div>
        </div>
    );
}
