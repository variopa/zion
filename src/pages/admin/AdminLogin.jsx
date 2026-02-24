import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
    const [credentials, setCredentials] = useState({ identifier: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: credentials.identifier,
                password: credentials.password,
            });

            if (authError) {
                console.error("Auth Error details:", authError);
                throw authError;
            }

            navigate('/birthna/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid credentials or unauthorized access.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4 relative overflow-hidden selection:bg-orange-500/20 selection:text-orange-400">

            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/8 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-600/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%] bg-orange-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md relative z-10"
            >
                {/* Login Card */}
                <div className="glass-panel rounded-3xl p-10 md:p-12 border border-white/10 shadow-2xl">

                    <div className="text-center mb-10">
                        {/* Animated ZION Gradient Logo */}
                        <div className="relative inline-block group mb-6">
                            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-orange-500 to-red-600 opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
                            <h1 className="relative text-5xl font-black tracking-tighter gradient-text-animated leading-none">
                                ZION
                            </h1>
                        </div>

                        <p className="text-white/40 mt-3 font-medium text-sm">
                            Sign in to access the dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold border border-red-500/20 flex items-center gap-2"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            {/* Email Field */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-white/30" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="Email address"
                                    value={credentials.identifier}
                                    onChange={(e) => setCredentials({ ...credentials, identifier: e.target.value })}
                                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 font-medium transition-all focus:border-orange-500/50 focus:bg-white/10 focus:ring-0 outline-none text-sm"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-white/30" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="Password"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 font-medium transition-all focus:border-orange-500/50 focus:bg-white/10 focus:ring-0 outline-none text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-4 px-4 rounded-xl text-sm font-bold text-white overflow-hidden transition-all"
                            style={{
                                background: 'linear-gradient(135deg, #ff6700, #ef4444)',
                                boxShadow: '0 4px 25px rgba(255, 103, 0, 0.35)'
                            }}
                        >
                            {/* Hover shimmer */}
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></span>

                            <div className="relative flex items-center gap-2">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
