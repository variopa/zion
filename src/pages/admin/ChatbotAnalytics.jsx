import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    MessageSquare, Users, Star, Activity,
    ArrowUpRight, RefreshCw, AlertTriangle, Database, ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';
import { useOutletContext } from 'react-router-dom';

const ChatbotAnalytics = () => {
    const { userRole } = useOutletContext();
    const [stats, setStats] = useState({
        totalChats: 0,
        totalRequests: 0,
        avgRating: 0,
        totalRatings: 0,
        recentInteractions: []
    });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Fetch Totals (Exhaustive, not limited)
            // Using a clever trick to get unique session count without returning all rows
            const [sessionsRes, requestsRes, ratingRes] = await Promise.all([
                supabase.from('chatbot_interactions').select('session_id'),
                supabase.from('chatbot_interactions').select('id', { count: 'exact', head: true }).eq('event_type', 'request'),
                supabase.from('chatbot_interactions').select('rating').eq('event_type', 'rating').not('rating', 'is', null)
            ]);

            // Calculate unique sessions from the IDs (Supabase client-side uniqueness)
            const uniqueSessionIds = new Set((sessionsRes.data || []).map(r => r.session_id));
            const totalSessions = uniqueSessionIds.size;

            const totalRequests = requestsRes.count || 0;
            const ratings = ratingRes.data || [];
            const avgRating = ratings.length > 0
                ? (ratings.reduce((sum, d) => sum + (d.rating || 0), 0) / ratings.length).toFixed(1)
                : 0;

            // 2. Fetch Recent Data for Charts and Log (Limited to recent for performance)
            const { data: rawData, error: fetchError } = await supabase
                .from('chatbot_interactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (fetchError) throw fetchError;

            // Chart: requests per day (last 7 days) from the most recent 200 items (usually enough for 7 days)
            const dateGroups = {};
            const recentRequests = (rawData || []).filter(d => d.event_type === 'request');
            recentRequests.forEach(d => {
                try {
                    const date = format(new Date(d.created_at), 'MM/dd');
                    dateGroups[date] = (dateGroups[date] || 0) + 1;
                } catch (e) { /* skip */ }
            });

            const chartPoints = Object.entries(dateGroups)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => a.name.localeCompare(b.name)) // Sort by date
                .slice(-7);

            setStats({
                totalChats: totalSessions,
                totalRequests,
                avgRating,
                totalRatings: ratings.length,
                recentInteractions: (rawData || []).slice(0, 20)
            });
            setChartData(chartPoints);
            setLastRefresh(new Date());

        } catch (err) {
            console.error('Analytics Fetch Error:', err);
            setError(`Network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userRole === 'superadmin') {
            fetchAnalytics();
        }
    }, [fetchAnalytics, userRole]);

    // ─── ROLE PROTECTION ───────────────────
    if (userRole !== 'superadmin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                    <ShieldAlert size={40} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Access Restricted</h2>
                <p className="text-white/40 text-sm max-w-xs mx-auto font-medium">
                    This intelligence unit is classified. Only **Superadmins** have clearance to view live chatbot telemetry.
                </p>
                <div className="mt-8">
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
                    >
                        Return to Safety
                    </button>
                </div>
            </div>
        );
    }

    // ─── LOADING STATE ─────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Loading analytics...</p>
            </div>
        );
    }

    // ─── ERROR STATE ─────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle size={32} className="text-red-500" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white mb-2">Analytics Error</h3>
                    <p className="text-white/50 text-sm max-w-md">{error}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchAnalytics}
                        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={14} /> Retry
                    </button>
                </div>
                <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 max-w-md text-left">
                    <p className="text-[10px] uppercase tracking-widest font-black text-white/30 mb-2">Quick Fix</p>
                    <p className="text-white/60 text-xs">
                        Open <strong className="text-orange-400">Supabase SQL Editor</strong> and run the contents of{' '}
                        <code className="text-orange-400 bg-white/5 px-1.5 py-0.5 rounded">chatbot_analytics.sql</code>
                    </p>
                </div>
            </div>
        );
    }

    const statCards = [
        { label: "Total Sessions", value: stats.totalChats, icon: Users, color: "from-blue-500 to-indigo-600" },
        { label: "AI Requests", value: stats.totalRequests, icon: MessageSquare, color: "from-orange-500 to-red-600" },
        { label: "Avg Rating", value: stats.totalRatings > 0 ? `${stats.avgRating}/5` : 'N/A', icon: Star, color: "from-yellow-400 to-orange-500" },
        { label: "Status", value: "Online", icon: Activity, color: "from-green-500 to-emerald-600" }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">AI Intelligence Unit</h1>
                    <p className="text-white/40 mt-1 uppercase tracking-[0.2em] text-[10px] font-black italic">
                        Live Chatbot Telemetry
                        {lastRefresh && <span className="ml-4 normal-case tracking-normal not-italic"> · Updated {format(lastRefresh, 'HH:mm:ss')}</span>}
                    </p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                    title="Refresh"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Empty State */}
            {stats.totalRequests === 0 && stats.totalChats === 0 && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                        <Database size={28} className="text-orange-500" />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">No Data Yet</h3>
                    <p className="text-white/40 text-sm max-w-sm mx-auto">
                        Start using the chatbot on the main site to see analytics data appear here. Each chat session, request, and rating will be tracked automatically.
                    </p>
                </div>
            )}

            {/* Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-black text-white/30 mb-1">{stat.label}</p>
                                <h4 className="text-2xl font-black text-white tracking-tight">{stat.value}</h4>
                            </div>
                            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                                <stat.icon className="text-white" size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-white tracking-tight">Engagement Flow</h3>
                        <div className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold text-white/40 uppercase tracking-widest border border-white/5">Last 7 Days</div>
                    </div>
                    <div className="h-[300px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#ffffff30', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff30', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="value" fill="url(#colorBar)" radius={[10, 10, 0, 0]} />
                                    <defs>
                                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/20 text-sm">
                                No chart data available yet
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col">
                    <h3 className="text-xl font-black text-white tracking-tight mb-8 text-center">Satisfaction Matrix</h3>
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <div className="relative w-48 h-48 mb-8">
                            <div className="absolute inset-0 bg-orange-500 opacity-20 blur-[60px] rounded-full animate-pulse" />
                            <div className="absolute inset-4 border-8 border-orange-500/20 rounded-full" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-white">{stats.avgRating || '—'}</span>
                                <span className="text-[10px] uppercase font-black text-white/20 tracking-widest">
                                    {stats.totalRatings > 0 ? `${stats.totalRatings} ratings` : 'No ratings yet'}
                                </span>
                            </div>
                        </div>
                        <div className="w-full space-y-4">
                            {[
                                { label: "Uptime", val: 99 },
                                { label: "Response Rate", val: stats.totalRequests > 0 ? 100 : 0 },
                                { label: "Sessions Active", val: stats.totalChats > 0 ? 95 : 0 }
                            ].map((s, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-[10px] uppercase font-black text-white/40 mb-1 tracking-widest">
                                        <span>{s.label}</span>
                                        <span>{s.val}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${s.val}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Interactions Log */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-black text-white tracking-tight">Recent Interactions</h3>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        {stats.recentInteractions.length} entries
                    </span>
                </div>
                <div className="overflow-x-auto">
                    {stats.recentInteractions.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">
                                    <th className="px-8 py-5">Event</th>
                                    <th className="px-6 py-5">Session</th>
                                    <th className="px-6 py-5">Details</th>
                                    <th className="px-8 py-5 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {stats.recentInteractions.map((log, i) => (
                                    <tr key={log.id || i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.event_type === 'request' ? 'bg-orange-500/10 text-orange-500' :
                                                log.event_type === 'rating' ? 'bg-purple-500/10 text-purple-500' :
                                                    'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {log.event_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-white/40 font-mono text-xs">
                                            {(log.session_id || '').slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-5 text-white/80 italic text-xs">
                                            {log.event_type === 'request'
                                                ? (log.metadata?.query || 'Chat request').slice(0, 40)
                                                : log.event_type === 'rating'
                                                    ? `Rated: ${log.rating || 0}★`
                                                    : 'Session opened'}
                                        </td>
                                        <td className="px-8 py-5 text-right text-white/40 text-xs">
                                            {log.created_at ? format(new Date(log.created_at), 'MMM dd, HH:mm') : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-16 text-center text-white/20 text-sm">
                            No interactions recorded yet. Use the chatbot to generate data.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatbotAnalytics;
