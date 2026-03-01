import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Film, Play, Zap, Info, ChevronRight, ThumbsUp, ThumbsDown, Star } from 'lucide-react';

const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || 'https://variopa123-zionpai.hf.space/api';
const CHAT_ENDPOINT = `${PROXY_URL}/chat`;
const STARTERS_ENDPOINT = `${PROXY_URL}/starters`;

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showBubble, setShowBubble] = useState(true);
    const [input, setInput] = useState('');
    const [sessionId] = useState(crypto.randomUUID());
    const [hasLoggedOpen, setHasLoggedOpen] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Welcome to **Zion**. I am your cinema consultant. Tell me what you want to watch today!', id: 'welcome' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTemplates, setActiveTemplates] = useState([]);
    const [messageRatings, setMessageRatings] = useState({}); // Tracking ratings per message ID

    const popSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    const tingSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

    const trackEvent = async (eventType, metadata = {}, rating = null) => {
        try {
            const payload = {
                session_id: sessionId,
                event_type: eventType,
                metadata,
                ...(rating !== null && { rating })
            };
            const { error } = await supabase.from('chatbot_interactions').insert(payload);
            if (error) {
                console.error('Analytics Insert Error:', error.message, error.details);
            } else {
                console.log(`Analytics: ${eventType} tracked for session ${sessionId.slice(0, 8)}`);
            }
        } catch (error) {
            console.error('Analytics Network Error:', error);
        }
    };

    const fetchStarters = useCallback(async () => {
        try {
            const response = await axios.get(`${PROXY_URL}/starters`);
            // Sanitize or fallback to simple ones if AI yaps
            const received = response.data.slice(0, 4);
            if (received.length > 0) {
                setActiveTemplates(received);
            } else {
                throw new Error('Empty starters');
            }
        } catch (error) {
            setActiveTemplates([
                { label: "🎬 Best Action 2021", prompt: "Best action movie from 2021" },
                { label: "📺 Top Rated Series", prompt: "Top rated series similar to Stranger Things" },
                { label: "👻 Horror Classics", prompt: "Top rated romance movies from the 90s" },
                { label: "🌌 Sci-Fi Gems", prompt: "Show me mind-bending sci-fi films like Interstellar" }
            ]);
        }
    }, []);

    useEffect(() => {
        if (isOpen && !hasLoggedOpen) {
            trackEvent('open', { timestamp: new Date().toISOString() });
            setHasLoggedOpen(true);
        }
        if (isOpen && activeTemplates.length === 0) {
            fetchStarters();
        }
    }, [isOpen, hasLoggedOpen, activeTemplates.length, fetchStarters]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setShowBubble(false);
        } else {
            const checkAndShowBubble = () => {
                const now = Date.now();
                const storedData = localStorage.getItem('zion_chatbot_bubble_throttling');
                let data = storedData ? JSON.parse(storedData) : { count: 0, lastReset: now };

                // Reset if 30 minutes passed
                if (now - data.lastReset > 30 * 60 * 1000) {
                    data = { count: 0, lastReset: now };
                }

                if (data.count < 2) {
                    setShowBubble(true);
                    data.count += 1;
                    localStorage.setItem('zion_chatbot_bubble_throttling', JSON.stringify(data));

                    // Hide after 10 seconds
                    setTimeout(() => setShowBubble(false), 10000);
                }
            };

            // Initial show
            const timer = setTimeout(checkAndShowBubble, 3000);

            // Check every 5 minutes
            const interval = setInterval(checkAndShowBubble, 300000);

            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        }
    }, [isOpen]);

    const handleSend = async (e, customPrompt = null) => {
        if (e) e.preventDefault();
        const finalInput = (customPrompt || input || '').trim();
        if (!finalInput || isLoading) return;

        const userMessage = { role: 'user', content: finalInput };
        setMessages(prev => [...prev, userMessage]);
        if (!customPrompt) setInput('');
        setIsLoading(true);
        popSound.play().catch(e => console.log('Audio disabled'));

        try {
            const response = await axios.post(CHAT_ENDPOINT, {
                messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
            });

            const content = response.data.content;
            const assistantMsgId = crypto.randomUUID();
            setMessages(prev => [...prev, { role: 'assistant', content, id: assistantMsgId }]);
            tingSound.play().catch(e => console.log('Audio disabled'));

            trackEvent('request', {
                query: finalInput,
                response_length: content.length,
                is_template: !!customPrompt,
                msg_id: assistantMsgId
            });

            // The old rating system is being replaced by inline per-message rating
            // But we can still show the big one occasionally if helpful
            if (messages.length >= 6 && !ratingSubmitted) {
                setShowRating(true);
            }

        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I apologize, but my connection to the film archives is temporarily interrupted. Please try again in a moment.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const MarkdownComponents = {
        h3: ({ children }) => (
            <h3 className="text-[13px] font-black text-white mb-0.5 mt-3 first:mt-1 tracking-tight flex items-center gap-1.5">
                <div className="w-0.5 h-4 bg-gradient-to-b from-orange-400 to-red-600 rounded-full flex-shrink-0" />
                <span className="truncate">{children}</span>
            </h3>
        ),
        a: ({ href, children }) => {
            const hrefStr = String(href || '');
            if (!hrefStr) return <span className="text-white/20 text-[10px] italic">Link unavailable</span>;

            const isInternal = hrefStr.includes('zionmovies.pro.et') || hrefStr.includes('/watch/');
            let targetPath = hrefStr;
            if (isInternal) {
                const match = hrefStr.match(/\/watch\/(movies|tv)\/\d+/);
                targetPath = match ? match[0] : hrefStr.replace(/^https?:\/\/zionmovies\.pro\.et/, '').replace(/^\/+/, '/');
            }
            return (
                <Link
                    to={targetPath || '/'}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 mt-1.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 group"
                >
                    <Play size={10} fill="white" />
                    <span>{children || 'Watch Now'}</span>
                    <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            );
        },
        img: ({ src, alt }) => (
            <div className="my-1.5 group relative rounded-md overflow-hidden shadow-lg border border-white/10 max-w-[100px] mx-auto bg-white/5">
                <img
                    src={src}
                    alt={alt}
                    className="w-full object-cover aspect-[2/3] transform group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
                        e.target.className += ' grayscale opacity-30';
                    }}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-md" />
            </div>
        ),
        hr: () => <div className="my-2 border-t border-white/5" />,
        p: ({ children }) => {
            const text = String(children || '');
            const matchRegex = /(\d{1,3})%\s*match/i;
            const matchResult = text.match(matchRegex);
            if (matchResult) {
                const pct = parseInt(matchResult[1]);
                const color = pct >= 85 ? 'from-green-500 to-emerald-600' : pct >= 70 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-orange-600';
                return (
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <div className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${color} text-[8px] font-black text-white uppercase tracking-wider shadow`}>
                            {pct}% Match
                        </div>
                        <span className="text-[9px] text-white/40 font-medium">{text.replace(matchResult[0], '').replace(/[·•]/g, '').trim()}</span>
                    </div>
                );
            }
            return <p className="leading-snug text-white/60 text-[11px] mb-1 font-medium">{children}</p>;
        },
        em: ({ children }) => (
            <span className="text-white/40 text-[10px] italic">{children}</span>
        ),
        strong: ({ children }) => (
            <strong className="text-orange-400 font-black text-[11px]">{children}</strong>
        )
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
        setShowBubble(false); // Hide bubble immediately when toggled
    };

    return (
        <div className="relative">
            <div className="fixed bottom-6 right-6 z-[9998]">
                {/* Toggle Button */}
                <motion.button
                    onClick={handleToggle}
                    className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-orange-500 text-white shadow-[0_0_20px_rgba(255,103,0,0.4)] flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all group"
                    whileHover={{ y: -5 }}
                    animate={{
                        boxShadow: [
                            "0 0 20px rgba(255,103,0,0.4)",
                            "0 0 35px rgba(255,103,0,0.7)",
                            "0 0 20px rgba(255,103,0,0.4)"
                        ]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {isOpen ? <X size={28} /> : <MessageSquare size={28} />}

                    {/* Notification Bubble - Hidden on small mobile if it covers too much */}
                    {!isOpen && showBubble && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{
                                opacity: 1,
                                x: 0,
                                scale: 1,
                                y: [0, -5, 0]
                            }}
                            transition={{
                                y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="absolute bottom-20 right-0 bg-gradient-to-br from-[#1a1f2e] to-[#0d111a] border border-orange-500/30 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] min-w-[220px] hidden sm:block backdrop-blur-xl"
                        >
                            <div className="absolute inset-0 bg-orange-500/5 rounded-2xl animate-pulse" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-10"
                            >
                                <X size={12} />
                            </button>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-white mb-1">Stuck on what to watch?</p>
                                <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <Sparkles size={10} className="animate-spin" />
                                    Ask Zion AI Consultant
                                </p>
                            </div>
                        </motion.div>
                    )}
                </motion.button>
            </div>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed top-[120px] bottom-[110px] left-4 right-4 sm:top-auto sm:bottom-28 sm:right-6 sm:left-auto w-auto sm:w-[360px] h-auto sm:h-[480px] bg-[#0d111a] rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col z-[99999] border border-white/10 overflow-hidden backdrop-blur-3xl"
                    >
                        {/* Header */}
                        <div className="p-5 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center justify-between relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30">
                                    <Bot className="text-white" size={26} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-white tracking-tight text-xl">
                                        Zion AI
                                    </h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        <p className="text-[11px] uppercase tracking-[0.25em] font-black text-white/50">Consultant Active</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-3 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-white/5 border border-white/10 text-orange-500'
                                            }`}>
                                            {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                        </div>
                                        <div className={`p-3 rounded-2xl shadow-sm prose prose-invert prose-sm max-w-none overflow-hidden ${msg.role === 'user'
                                            ? 'bg-orange-500 text-white rounded-tr-none'
                                            : 'bg-white/5 text-white rounded-tl-none border border-white/5'
                                            }`}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                                                {msg.content}
                                            </ReactMarkdown>

                                            {/* Inline Feedback for Assistant Messages */}
                                            {msg.role === 'assistant' && msg.id && msg.id !== 'welcome' && (
                                                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                                                    <span className="text-[9px] uppercase tracking-widest font-black text-white/20">Was this helpful?</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                if (messageRatings[msg.id]) return;
                                                                trackEvent('rating', { msg_id: msg.id, context: 'inline' }, 5);
                                                                setMessageRatings(prev => ({ ...prev, [msg.id]: 5 }));
                                                            }}
                                                            className={`p-1.5 rounded-lg transition-all ${messageRatings[msg.id] === 5 ? 'bg-green-500/20 text-green-500' : 'hover:bg-white/5 text-white/20 hover:text-white'}`}
                                                        >
                                                            <ThumbsUp size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (messageRatings[msg.id]) return;
                                                                trackEvent('rating', { msg_id: msg.id, context: 'inline' }, 1);
                                                                setMessageRatings(prev => ({ ...prev, [msg.id]: 1 }));
                                                            }}
                                                            className={`p-1.5 rounded-lg transition-all ${messageRatings[msg.id] === 1 ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/5 text-white/20 hover:text-white'}`}
                                                        >
                                                            <ThumbsDown size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Templates inside the first assistant message */}
                                            {i === 0 && msg.role === 'assistant' && (
                                                <div className="mt-6 flex flex-col gap-2">
                                                    <p className="text-[10px] uppercase tracking-widest font-black text-white/20 mb-2">Pick a starting point</p>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {activeTemplates.map((tmpl, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => handleSend(null, tmpl.prompt)}
                                                                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs text-white/90 hover:text-white transition-all group text-left"
                                                            >
                                                                <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                                                    <Zap size={12} />
                                                                </div>
                                                                <span className="font-bold">{tmpl.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="flex gap-3 max-w-[85%]">
                                        <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 shadow-lg">
                                            <Bot size={16} />
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg rounded-tl-none border border-white/5 backdrop-blur-sm flex flex-col gap-2">
                                            <div className="flex gap-1.5">
                                                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-orange-500 rounded-full" />
                                                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-orange-500 rounded-full" />
                                                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-orange-500 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Rating Component */}
                        <AnimatePresence>
                            {showRating && !ratingSubmitted && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="px-5 py-4 bg-orange-500/10 border-t border-white/5"
                                >
                                    <p className="text-[10px] uppercase tracking-widest font-black text-center text-white/40 mb-3">Rate my assistance</p>
                                    <div className="flex justify-center gap-4">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => {
                                                    trackEvent('rating', {}, num);
                                                    setRatingSubmitted(true);
                                                    setShowRating(false);
                                                }}
                                                className="text-2xl hover:scale-125 transition-transform grayscale hover:grayscale-0"
                                            >
                                                {num === 1 ? '😠' : num === 2 ? '😕' : num === 3 ? '😐' : num === 4 ? '🙂' : '🤩'}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        <div className="p-5 bg-gradient-to-t from-black/20 to-transparent border-t border-white/10">
                            <form onSubmit={handleSend} className="flex gap-2 items-center">
                                <div className="relative flex-1 group">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Consult Zion AI..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-all hover:bg-white/10"
                                    />
                                </div>
                                <motion.button
                                    whileHover={!isLoading && input.trim() ? { scale: 1.05 } : {}}
                                    whileTap={!isLoading && input.trim() ? { scale: 0.95 } : {}}
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20 disabled:opacity-30 flex-shrink-0 transition-all"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                </motion.button>
                            </form>
                            <p className="text-center text-[9px] text-white/10 mt-4 uppercase tracking-[0.3em] font-black italic">
                                Zion Intelligence Unit
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatBot;
