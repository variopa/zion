import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Megaphone, Activity, LogOut, Loader2, Users, ShieldCheck, Shield, Menu, X, MessageSquare } from 'lucide-react';

const ROLE_CONFIG = {
    superadmin: { label: 'Superadmin', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: ShieldCheck },
    admin: { label: 'Administrator', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: Shield },
    moderator: { label: 'Moderator', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Users },
};

export default function AdminLayout() {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate('/birthna/login');
                    return;
                }

                setUser(session.user);

                // Fetch Profile Role
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, email')
                    .eq('id', session.user.id)
                    .single();


                if (profileError) {
                    console.error('Profile fetch error:', profileError);
                    // If RLS still blocks, try using the get_my_role() RPC as fallback
                    try {
                        const { data: roleData, error: rpcError } = await supabase.rpc('get_my_role');
                        if (roleData && !rpcError) {
                            setUserRole(roleData);
                        } else {
                            setUserRole('moderator');
                        }
                    } catch (rpcErr) {
                        console.error('RPC fallback failed:', rpcErr);
                        setUserRole('moderator');
                    }
                } else if (profile) {
                    setUserRole(profile.role);
                } else {
                    setUserRole('moderator');
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                navigate('/birthna/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_OUT' || !session) {
                    navigate('/birthna/login');
                } else {
                    setUser(session.user);
                }
            }
        );

        return () => authListener.subscription.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-[#ff6700] animate-spin" />
                <p className="text-white/60 font-black tracking-[0.2em] text-xs uppercase animate-pulse">
                    Authenticating Zion Identity
                </p>
            </div>
        );
    }

    if (!user) return null;

    const roleConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.moderator;
    const RoleIcon = roleConfig.icon;

    // Build nav items based on role
    const navItems = [
        { name: 'Analytics', path: '/birthna/dashboard', icon: LayoutDashboard },
    ];

    // Admin and Superadmin can manage ads
    if (userRole === 'superadmin' || userRole === 'admin') {
        navItems.push({ name: 'Ad Campaigns', path: '/birthna/ads', icon: Megaphone });
    }

    navItems.push({ name: 'Live Sessions', path: '/birthna/live', icon: Activity });

    // Superadmin ONLY items
    if (userRole === 'superadmin') {
        navItems.push({ name: 'Chatbot AI', path: '/birthna/chatbot', icon: MessageSquare });
        navItems.push({ name: 'Admin Management', path: '/birthna/users', icon: Users });
    }

    const SidebarContent = ({ isMobile = false }) => (
        <>
            {/* Header */}
            <div className="p-8 pb-4">
                <div className="relative inline-block group">
                    <div className="absolute inset-0 blur-xl bg-gradient-to-r from-orange-500 to-red-600 opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
                    <h1 className="relative text-3xl font-black tracking-tighter gradient-text-animated leading-none">
                        ZION
                    </h1>
                </div>
                {/* Role Badge */}
                <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${roleConfig.bg} ${roleConfig.border} border ${roleConfig.color} font-black text-[10px] uppercase tracking-wider`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleConfig.label}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-6 space-y-3 mt-6">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 font-bold text-sm relative group
                                ${isActive
                                    ? 'text-white bg-white/5'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId={isMobile ? "activeBeamMobile" : "activeBeam"}
                                    className="absolute left-0 w-1 h-2/3 bg-orange-500 shadow-[0_0_15px_#ff6700] rounded-full"
                                />
                            )}
                            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            {/* User Info + Logout */}
            <div className="p-6 space-y-4">
                <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm font-bold text-white/80 truncate">{user.email}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3.5 w-full rounded-2xl transition-all duration-300 font-bold text-sm text-red-500/80 hover:text-red-600 hover:bg-red-500/10 group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Terminate Session
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex text-white font-sans selection:bg-[#ff6700]/20 selection:text-[#ff6700]">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 bg-[#0f172a] -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Desktop Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-72 hidden lg:flex flex-col flex-shrink-0 relative z-20 m-6 mr-0 glass-panel border border-white/20 shadow-2xl overflow-hidden"
            >
                <SidebarContent />
            </motion.aside>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-80 z-50 lg:hidden flex flex-col glass-panel border-r border-white/20 shadow-2xl"
                        >
                            <div className="absolute top-4 right-4">
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-xl bg-white/10 text-white/60 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <SidebarContent isMobile={true} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 p-6">
                {/* Mobile Header */}
                <div className="flex justify-between items-center mb-6 lg:hidden">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 glass-panel rounded-xl text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black tracking-tighter gradient-text-animated">ZION</span>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${roleConfig.bg} ${roleConfig.border} border ${roleConfig.color} font-black text-[8px] uppercase tracking-wider`}>
                            <RoleIcon className="w-2.5 h-2.5" />
                            {roleConfig.label}
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl glass-panel flex items-center justify-center font-bold text-white/50">
                        {user.email[0].toUpperCase()}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet context={{ userRole }} />
                    </div>
                </div>
            </main>
        </div>
    );
}
