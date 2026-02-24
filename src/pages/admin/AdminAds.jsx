import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Edit3, Eye, EyeOff, Loader2, Image as ImageIcon,
    Upload, X, AlertTriangle, Megaphone, ExternalLink, MousePointerClick,
    Calendar, DollarSign, ChevronDown, ChevronUp
} from 'lucide-react';

export default function AdminAds() {
    const { userRole } = useOutletContext();
    const isReadOnly = userRole === 'moderator';

    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedCampaign, setExpandedCampaign] = useState(null);

    // Campaign form state
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'draft',
        start_date: '',
        end_date: '',
        budget: '',
    });

    // Creative form state
    const [showCreativeForm, setShowCreativeForm] = useState(false);
    const [creativeFormCampaignId, setCreativeFormCampaignId] = useState(null);
    const [creativeData, setCreativeData] = useState({
        name: '',
        destination_url: '',
        desktop_image_url: '',
        mobile_image_url: '',
    });
    const [desktopFile, setDesktopFile] = useState(null);
    const [mobileFile, setMobileFile] = useState(null);
    const [desktopPreview, setDesktopPreview] = useState(null);
    const [mobilePreview, setMobilePreview] = useState(null);
    const [uploadingCreative, setUploadingCreative] = useState(false);

    const desktopInputRef = useRef(null);
    const mobileInputRef = useRef(null);

    useEffect(() => { fetchCampaigns(); }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('ad_campaigns')
                .select('*, ad_creatives(*)')
                .order('created_at', { ascending: false });

            if (fetchError) {
                setError(`Failed to load campaigns: ${fetchError.message}`);
                return;
            }
            setCampaigns(data || []);
        } catch (err) {
            setError(`Unexpected error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ---- FILE UPLOAD ----
    const handleFileSelect = (file, type) => {
        if (!file) return;
        const preview = URL.createObjectURL(file);
        if (type === 'desktop') {
            setDesktopFile(file);
            setDesktopPreview(preview);
        } else {
            setMobileFile(file);
            setMobilePreview(preview);
        }
    };

    const uploadFileToPublic = async (file, prefix) => {
        // Generate unique filename
        const ext = file.name.split('.').pop();
        const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;

        // Convert to base64 data URL for storage via Supabase Storage
        // Since we don't have a backend, use Supabase Storage bucket
        try {
            const { data, error } = await supabase.storage
                .from('ad-images')
                .upload(filename, file, {
                    contentType: file.type,
                    upsert: false
                });

            if (error) {
                // Fallback: If storage bucket doesn't exist, use data URL approach
                console.warn('Supabase Storage upload failed, using data URL fallback:', error.message);
                return await fileToDataUrl(file);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('ad-images')
                .getPublicUrl(filename);

            return urlData.publicUrl;
        } catch (err) {
            console.warn('Storage error, using data URL fallback:', err);
            return await fileToDataUrl(file);
        }
    };

    const fileToDataUrl = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    };

    // ---- CAMPAIGN CRUD ----
    const handleSaveCampaign = async () => {
        if (!formData.name || !formData.start_date || !formData.end_date) return;

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                status: formData.status,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString(),
                budget: formData.budget ? parseFloat(formData.budget) : null,
            };

            if (editingCampaign) {
                const { error } = await supabase
                    .from('ad_campaigns')
                    .update(payload)
                    .eq('id', editingCampaign.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('ad_campaigns')
                    .insert([payload]);
                if (error) throw error;
            }

            resetCampaignForm();
            fetchCampaigns();
        } catch (err) {
            setError(`Save failed: ${err.message}`);
        }
    };

    const handleDeleteCampaign = async (id) => {
        if (!confirm('Delete this campaign and all its creatives?')) return;
        try {
            const { error } = await supabase.from('ad_campaigns').delete().eq('id', id);
            if (error) throw error;
            fetchCampaigns();
        } catch (err) {
            setError(`Delete failed: ${err.message}`);
        }
    };

    const handleToggleStatus = async (campaign) => {
        const newStatus = campaign.status === 'active' ? 'paused' : 'active';
        try {
            const { error } = await supabase
                .from('ad_campaigns')
                .update({ status: newStatus })
                .eq('id', campaign.id);
            if (error) throw error;
            fetchCampaigns();
        } catch (err) {
            setError(`Status toggle failed: ${err.message}`);
        }
    };

    // ---- CREATIVE CRUD ----
    const handleSaveCreative = async () => {
        if (!creativeData.name || !creativeData.destination_url) return;

        setUploadingCreative(true);
        try {
            let desktopUrl = creativeData.desktop_image_url;
            let mobileUrl = creativeData.mobile_image_url;

            // Upload files if selected
            if (desktopFile) {
                desktopUrl = await uploadFileToPublic(desktopFile, 'desktop');
            }
            if (mobileFile) {
                mobileUrl = await uploadFileToPublic(mobileFile, 'mobile');
            }

            if (!desktopUrl || !mobileUrl) {
                setError('Both desktop and mobile images are required');
                return;
            }

            const { error } = await supabase
                .from('ad_creatives')
                .insert([{
                    campaign_id: creativeFormCampaignId,
                    name: creativeData.name,
                    desktop_image_url: desktopUrl,
                    mobile_image_url: mobileUrl,
                    destination_url: creativeData.destination_url,
                }]);

            if (error) throw error;
            resetCreativeForm();
            fetchCampaigns();
        } catch (err) {
            setError(`Creative save failed: ${err.message}`);
        } finally {
            setUploadingCreative(false);
        }
    };

    const handleDeleteCreative = async (id) => {
        if (!confirm('Delete this ad creative?')) return;
        try {
            const { error } = await supabase.from('ad_creatives').delete().eq('id', id);
            if (error) throw error;
            fetchCampaigns();
        } catch (err) {
            setError(`Delete failed: ${err.message}`);
        }
    };

    // ---- FORM HELPERS ----
    const resetCampaignForm = () => {
        setShowForm(false);
        setEditingCampaign(null);
        setFormData({ name: '', description: '', status: 'draft', start_date: '', end_date: '', budget: '' });
    };

    const resetCreativeForm = () => {
        setShowCreativeForm(false);
        setCreativeFormCampaignId(null);
        setCreativeData({ name: '', destination_url: '', desktop_image_url: '', mobile_image_url: '' });
        setDesktopFile(null);
        setMobileFile(null);
        setDesktopPreview(null);
        setMobilePreview(null);
    };

    const startEditCampaign = (campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            name: campaign.name,
            description: campaign.description || '',
            status: campaign.status,
            start_date: campaign.start_date?.split('T')[0] || '',
            end_date: campaign.end_date?.split('T')[0] || '',
            budget: campaign.budget || '',
        });
        setShowForm(true);
    };

    const openCreativeForm = (campaignId) => {
        setCreativeFormCampaignId(campaignId);
        setShowCreativeForm(true);
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#ff6700]" />
            </div>
        );
    }

    const STATUS_STYLES = {
        active: 'bg-green-500/10 text-green-400 border-green-500/30',
        paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        draft: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
        expired: 'bg-red-500/10 text-red-400 border-red-500/30',
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Ad Campaigns</h1>
                    <p className="text-white/40 font-medium mt-1">
                        {isReadOnly ? 'View-only access · Contact admin for changes' : 'Manage campaigns and ad creatives'}
                    </p>
                </div>
                {!isReadOnly && (
                    <button
                        onClick={() => { resetCampaignForm(); setShowForm(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,103,0,0.3)]"
                    >
                        <Plus className="w-4 h-4" />
                        New Campaign
                    </button>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-red-400 text-sm font-bold">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400">
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}

            {/* Campaign Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-panel p-8 border border-orange-500/20 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-white">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h3>
                            <button onClick={resetCampaignForm} className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Campaign Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none text-sm text-white font-medium"
                                    placeholder="e.g. Summer Sale 2026"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none text-sm text-white font-medium"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Start Date *</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none text-sm text-white font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">End Date *</label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none text-sm text-white font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Budget ($)</label>
                                <input
                                    type="number"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none text-sm text-white font-medium"
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-orange-500/50 outline-none text-sm text-white font-medium resize-none h-20"
                                    placeholder="Campaign description..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={resetCampaignForm} className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white font-bold text-sm transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSaveCampaign} className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all">
                                {editingCampaign ? 'Update' : 'Create Campaign'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Creative Upload Form */}
            <AnimatePresence>
                {showCreativeForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-panel p-8 border border-blue-500/20 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-white">Upload Ad Creative</h3>
                            <button onClick={resetCreativeForm} className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Creative Name *</label>
                                <input
                                    type="text"
                                    value={creativeData.name}
                                    onChange={(e) => setCreativeData({ ...creativeData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-blue-500/50 outline-none text-sm text-white font-medium"
                                    placeholder="e.g. Banner v1"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Destination URL *</label>
                                <input
                                    type="url"
                                    value={creativeData.destination_url}
                                    onChange={(e) => setCreativeData({ ...creativeData, destination_url: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-blue-500/50 outline-none text-sm text-white font-medium"
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>

                        {/* Image Uploads */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Desktop Image */}
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Desktop Image *</label>
                                <input ref={desktopInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0], 'desktop')} />
                                {desktopPreview ? (
                                    <div className="relative group">
                                        <img src={desktopPreview} alt="Desktop preview" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                                        <button
                                            onClick={() => { setDesktopFile(null); setDesktopPreview(null); }}
                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => desktopInputRef.current?.click()}
                                        className="w-full h-40 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer"
                                    >
                                        <Upload className="w-8 h-8 text-white/30" />
                                        <span className="text-xs text-white/40 font-bold">Click to upload (1920×400 recommended)</span>
                                    </button>
                                )}
                            </div>

                            {/* Mobile Image */}
                            <div>
                                <label className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 block">Mobile Image *</label>
                                <input ref={mobileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0], 'mobile')} />
                                {mobilePreview ? (
                                    <div className="relative group">
                                        <img src={mobilePreview} alt="Mobile preview" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                                        <button
                                            onClick={() => { setMobileFile(null); setMobilePreview(null); }}
                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => mobileInputRef.current?.click()}
                                        className="w-full h-40 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer"
                                    >
                                        <Upload className="w-8 h-8 text-white/30" />
                                        <span className="text-xs text-white/40 font-bold">Click to upload (600×200 recommended)</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={resetCreativeForm} className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white font-bold text-sm transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCreative}
                                disabled={uploadingCreative}
                                className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center gap-2"
                            >
                                {uploadingCreative ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {uploadingCreative ? 'Uploading...' : 'Upload Creative'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Campaigns List */}
            {campaigns.length === 0 ? (
                <div className="glass-panel p-12 border border-white/10 flex flex-col items-center justify-center text-center">
                    <Megaphone className="w-12 h-12 text-white/20 mb-4" />
                    <h3 className="text-lg font-bold text-white/60">No Campaigns Yet</h3>
                    <p className="text-white/30 text-sm mt-1">Create your first campaign to start showing ads on the platform</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {campaigns.map((campaign) => {
                        const isExpanded = expandedCampaign === campaign.id;
                        const creatives = campaign.ad_creatives || [];
                        const totalClicks = creatives.reduce((acc, c) => acc + (c.click_count || 0), 0);
                        const totalImpressions = creatives.reduce((acc, c) => acc + (c.impression_count || 0), 0);

                        return (
                            <motion.div
                                key={campaign.id}
                                layout
                                className="glass-panel border border-white/10 overflow-hidden"
                            >
                                {/* Campaign Header */}
                                <div
                                    className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                                <Megaphone className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{campaign.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_STYLES[campaign.status] || STATUS_STYLES.draft}`}>
                                                        {campaign.status}
                                                    </span>
                                                    <span className="text-xs text-white/40 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(campaign.start_date).toLocaleDateString()} — {new Date(campaign.end_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="hidden md:flex items-center gap-6 mr-4">
                                                <div className="text-center">
                                                    <p className="text-lg font-black text-white">{creatives.length}</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Creatives</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-black text-white">{totalClicks}</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Clicks</p>
                                                </div>
                                                {campaign.budget && (
                                                    <div className="text-center">
                                                        <p className="text-lg font-black text-white">${parseFloat(campaign.budget).toLocaleString()}</p>
                                                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Budget</p>
                                                    </div>
                                                )}
                                            </div>

                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/10"
                                        >
                                            <div className="p-6 space-y-6">
                                                {/* Campaign Actions */}
                                                {!isReadOnly && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button onClick={() => handleToggleStatus(campaign)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-bold transition-all">
                                                            {campaign.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            {campaign.status === 'active' ? 'Pause' : 'Activate'}
                                                        </button>
                                                        <button onClick={() => startEditCampaign(campaign)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-bold transition-all">
                                                            <Edit3 className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button onClick={() => openCreativeForm(campaign.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-sm font-bold transition-all">
                                                            <Plus className="w-4 h-4" />
                                                            Add Creative
                                                        </button>
                                                        <button onClick={() => handleDeleteCampaign(campaign.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-bold transition-all ml-auto">
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Creatives List */}
                                                {creatives.length === 0 ? (
                                                    <div className="text-center py-8 text-white/30">
                                                        <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                                                        <p className="text-sm font-bold">No creatives yet — upload images to display ads</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {creatives.map((creative) => (
                                                            <div key={creative.id} className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/5">
                                                                <img
                                                                    src={creative.desktop_image_url}
                                                                    alt={creative.name}
                                                                    className="w-full h-40 object-cover"
                                                                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160"><rect fill="%23333" width="400" height="160"/><text fill="%23666" x="200" y="80" text-anchor="middle" dy=".3em" font-size="14">Image unavailable</text></svg>'; }}
                                                                />
                                                                <div className="p-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <p className="text-sm font-bold text-white">{creative.name}</p>
                                                                            <div className="flex items-center gap-3 mt-1">
                                                                                <span className="text-xs text-white/40 flex items-center gap-1">
                                                                                    <MousePointerClick className="w-3 h-3" />
                                                                                    {creative.click_count || 0} clicks
                                                                                </span>
                                                                                <a href={creative.destination_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                                                    <ExternalLink className="w-3 h-3" />
                                                                                    Link
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                        {!isReadOnly && (
                                                                            <button onClick={() => handleDeleteCreative(creative.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all">
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Read-Only Notice */}
            {isReadOnly && (
                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-blue-400">Moderator Access</h4>
                        <p className="text-blue-400/60 text-sm mt-1">
                            You have view-only access to ad campaigns. Contact an Administrator or Superadmin to create or modify campaigns.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
