import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, Shield, ShieldCheck, ShieldAlert, Trash2,
    Mail, Loader2, Search, X, AlertTriangle, CheckCircle, Eye, EyeOff, Lock
} from 'lucide-react';

const ROLE_CONFIG = {
    superadmin: { icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Superadmin' },
    admin: { icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Administrator' },
    moderator: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Moderator' },
};

export default function AdminUsers() {
    const { userRole } = useOutletContext();
    const [isLoading, setIsLoading] = useState(true);
    const [profiles, setProfiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'admin',
    });

    const fetchProfiles = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (err) {
            console.error('Error fetching profiles:', err);
            setMessage({ type: 'error', text: `Failed to fetch profiles: ${err.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    // Create new admin user via Supabase Auth
    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password) {
            setMessage({ type: 'error', text: 'Email and password are required' });
            return;
        }
        if (newUser.password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setCreating(true);
        try {
            // 1. Create the user in Supabase Auth
            // Note: signUp will trigger the handle_new_user() function which creates a profile
            // But we need to use the admin API or a workaround since signUp logs us in as the new user

            // We'll use the Supabase Auth admin API through an RPC or direct signup
            // Since we can't use admin API from client, we'll:
            // a) Sign up the user (this won't sign us out with autoconfirm)
            // b) Then update their profile role

            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: newUser.email,
                password: newUser.password,
                options: {
                    data: {
                        full_name: newUser.full_name,
                        role: newUser.role,
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (signUpData.user) {
                // The handle_new_user trigger should have created a profile
                // But let's also explicitly update the role in case the trigger used the default
                // Wait a moment for the trigger to fire
                await new Promise(resolve => setTimeout(resolve, 1000));

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ role: newUser.role, full_name: newUser.full_name })
                    .eq('id', signUpData.user.id);

                if (updateError) {
                    console.warn('Profile update after creation:', updateError);
                }

                setMessage({ type: 'success', text: `Successfully created ${newUser.role}: ${newUser.email}` });
                setShowCreateForm(false);
                setNewUser({ email: '', password: '', full_name: '', role: 'admin' });
                fetchProfiles();
            }
        } catch (err) {
            setMessage({ type: 'error', text: `Creation failed: ${err.message}` });
        } finally {
            setCreating(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            setMessage({ type: 'success', text: `Role updated to ${newRole}` });
            fetchProfiles();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handleToggleActive = async (userId, currentActive) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: !currentActive })
                .eq('id', userId);

            if (error) throw error;
            setMessage({ type: 'success', text: `User ${currentActive ? 'deactivated' : 'activated'}` });
            fetchProfiles();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handleDeleteUser = async (profile) => {
        if (profile.role === 'superadmin') {
            setMessage({ type: 'error', text: 'Cannot delete a Superadmin' });
            return;
        }
        if (!confirm(`Delete user ${profile.email}? This will permanentely remove their account and profile.`)) return;

        try {
            // Use RPC to delete from auth.users (requires security definer function)
            const { error } = await supabase.rpc('delete_user_by_id', {
                target_user_id: profile.id
            });

            if (error) {
                // If RPC fails (e.g. function doesn't exist yet), fallback to profile deletion
                // though it likely won't work for Auth users without it.
                console.warn('RPC deletion failed, attempting fallback:', error.message);

                const { error: profileError } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', profile.id);

                if (profileError) throw profileError;
            }

            setMessage({ type: 'success', text: `Deleted ${profile.email}` });
            fetchProfiles();
        } catch (err) {
            setMessage({ type: 'error', text: `Delete failed: ${err.message}. Make sure to run the SQL migration if you haven't yet.` });
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.full_name && p.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Auto-clear messages after 5 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (isLoading) {
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
                    <h1 className="text-4xl font-black text-white tracking-tight">Admin Management</h1>
                    <p className="text-white/40 font-medium mt-1">Create administrators and control system access</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 inset-y-0 my-auto w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Find administrator..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none w-64 text-sm font-medium text-white transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,103,0,0.3)]"
                    >
                        <UserPlus className="w-4 h-4" />
                        Create Admin
                    </button>
                </div>
            </div>

            {/* Message Banner */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border ${message.type === 'success'
                            ? 'bg-green-500/10 text-green-400 border-green-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}
                    >
                        {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {message.text}
                        <button onClick={() => setMessage(null)} className="ml-auto p-1">
                            <X className="w-3 h-3" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Admin Form */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-panel p-8 border border-orange-500/20 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <UserPlus className="w-6 h-6 text-orange-500" />
                                Create New Administrator
                            </h3>
                            <button onClick={() => setShowCreateForm(false)} className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Full Name</label>
                                <input
                                    type="text"
                                    value={newUser.full_name}
                                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none text-sm text-white font-medium"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 inset-y-0 my-auto w-4 h-4 text-white/30" />
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none text-sm text-white font-medium"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">
                                    Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 inset-y-0 my-auto w-4 h-4 text-white/30" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full pl-11 pr-12 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none text-sm text-white font-medium"
                                        placeholder="Min 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 inset-y-0 my-auto text-white/30 hover:text-white/60"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none text-sm text-white font-medium"
                                >
                                    <option value="admin">Administrator</option>
                                    <option value="moderator">Moderator</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCreateForm(false)} className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white font-bold text-sm transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateUser}
                                disabled={creating}
                                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center gap-2"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                {creating ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Users Table */}
            <div className="glass-panel border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-white/30 text-[10px] uppercase tracking-widest font-black border-b border-white/10">
                                <th className="pb-4 pt-6 pl-6">Administrator</th>
                                <th className="pb-4 pt-6">Role</th>
                                <th className="pb-4 pt-6">Status</th>
                                <th className="pb-4 pt-6 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-white/30">
                                        <Users className="w-10 h-10 mx-auto mb-3" />
                                        <p className="font-bold">No administrators found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProfiles.map((profile) => {
                                    const roleConfig = ROLE_CONFIG[profile.role] || ROLE_CONFIG.moderator;
                                    const RoleIcon = roleConfig.icon;
                                    const isSelf = false; // Could check against current user
                                    const isSuperadmin = profile.role === 'superadmin';

                                    return (
                                        <tr key={profile.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-5 pl-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white/50 text-lg">
                                                        {profile.email?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{profile.full_name || 'System User'}</p>
                                                        <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium mt-0.5">
                                                            <Mail className="w-3 h-3" />
                                                            {profile.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${roleConfig.bg} ${roleConfig.border} border ${roleConfig.color} font-black text-[10px] uppercase tracking-wider`}>
                                                    <RoleIcon className="w-3 h-3" />
                                                    {roleConfig.label}
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${profile.is_active !== false ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                                    <span className={`text-xs font-bold ${profile.is_active !== false ? 'text-green-400' : 'text-red-400'}`}>
                                                        {profile.is_active !== false ? 'Active' : 'Revoked'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 text-right pr-6">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!isSuperadmin && (
                                                        <>
                                                            {/* Cycle Role */}
                                                            <button
                                                                onClick={() => handleRoleChange(profile.id, profile.role === 'admin' ? 'moderator' : 'admin')}
                                                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-orange-400 hover:border-orange-500/30 transition-all"
                                                                title={`Switch to ${profile.role === 'admin' ? 'Moderator' : 'Admin'}`}
                                                            >
                                                                <Shield className="w-4 h-4" />
                                                            </button>
                                                            {/* Toggle Active */}
                                                            <button
                                                                onClick={() => handleToggleActive(profile.id, profile.is_active !== false)}
                                                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-yellow-400 hover:border-yellow-500/30 transition-all"
                                                                title={profile.is_active !== false ? 'Deactivate' : 'Activate'}
                                                            >
                                                                {profile.is_active !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                            {/* Delete */}
                                                            <button
                                                                onClick={() => handleDeleteUser(profile)}
                                                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-all"
                                                                title="Delete user"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {isSuperadmin && (
                                                        <span className="text-[10px] text-purple-400/60 font-black uppercase tracking-wider">Protected</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Legend */}
            <div className="glass-panel p-6 border border-white/10">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    Role Permissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-black text-purple-400">Superadmin</span>
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed">Full system authority. Create/manage admins, analytics, campaigns, system health.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-black text-orange-400">Administrator</span>
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed">Analytics dashboard, campaign management, creative uploads.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-black text-blue-400">Moderator</span>
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed">Read-only analytics and live sessions view. No campaign control.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
