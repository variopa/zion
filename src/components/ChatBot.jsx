import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Film, Play, Zap, Info, ChevronRight } from 'lucide-react';

const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || 'https://variopa123-zionpai.hf.space/api/chat';

const TEMPLATES = [
    { label: "🔥 Action Movies", prompt: "Recommend 2 pulse-pounding action movies." },
    { label: "💀 Like Deadpool", prompt: "I loved Deadpool. Recommend 2 similar movies." },
    { label: "🧠 Mind-bending", prompt: "Recommend 2 cerebral movies like Inception." },
    { label: "🎬 Zion Gems", prompt: "What are 2 must-watch gems on Zion right now?" }
];

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showBubble, setShowBubble] = useState(true);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Welcome to **Zion**. I am your AI cinema concierge. What kind of atmosphere are you looking for in a film today?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
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
            // Show bubble immediately on load
            const initialTimer = setTimeout(() => setShowBubble(true), 1000);

            // Repeat every 5 minutes
            const interval = setInterval(() => {
                if (!isOpen) setShowBubble(true);
            }, 300000); // 5 minutes

            // Hide after 10 seconds of being shown
            let hideTimer;
            if (showBubble) {
                hideTimer = setTimeout(() => setShowBubble(false), 10000);
            }

            return () => {
                clearTimeout(initialTimer);
                clearInterval(interval);
                clearTimeout(hideTimer);
            };
        }
    }, [isOpen, showBubble]);

    const handleSend = async (e, customPrompt = null) => {
        if (e) e.preventDefault();
        const finalInput = customPrompt || input;
        if (!finalInput.trim() || isLoading) return;

        const userMessage = { role: 'user', content: finalInput };
        setMessages(prev => [...prev, userMessage]);
        if (!customPrompt) setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post(PROXY_URL, {
                messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response.data.content }]);
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
            <h3 className="text-xl font-black text-white mb-2 mt-6 first:mt-2 tracking-tight flex items-center gap-2">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                {children}
            </h3>
        ),
        a: ({ href, children, ...props }) => {
            // Robust internal routing: handle absolute, relative, and malformed links
            const hrefStr = String(href || '');
            const isInternal = hrefStr.includes('zionmovies.pro.et') || hrefStr.includes('/watch/');
            let targetPath = hrefStr;

            if (isInternal) {
                // Extracts the /watch/... part even if there's a domain prefix or strange wrap
                const match = hrefStr.match(/\/watch\/(movies|tv)\/\d+/);
                targetPath = match ? match[0] : hrefStr.replace(/^https?:\/\/zionmovies\.pro\.et/, '').replace(/^\/+/, '/');
            }

            return (
                <Link
                    to={isInternal ? targetPath : hrefStr}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-orange-500/40 group mt-3 whitespace-nowrap"
                >
                    <Play size={16} fill="white" />
                    <span>{children || "Watch on Zion"}</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            );
        },
        img: ({ src, alt }) => (
            <div className="my-6 group relative rounded-xl overflow-hidden shadow-2xl border border-white/10 max-w-[200px] mx-auto bg-white/5">
                <img
                    src={src}
                    alt={alt}
                    className="w-full object-cover aspect-[2/3] transform group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/500x750?text=Poster+Missing';
                        e.target.className += ' grayscale opacity-30';
                    }}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-xl" />
            </div>
        ),
        hr: () => <hr className="my-8 border-white/5" />,
        p: ({ children }) => <p className="leading-relaxed text-white/90 mb-4 font-medium">{children}</p>
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] sm:bottom-8 sm:right-8">
            {/* Bubble Message */}
            <AnimatePresence>
                {showBubble && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-16 right-0 mb-4 px-6 py-3 bg-white text-black font-bold text-[13px] rounded-2xl rounded-br-none shadow-2xl z-10 pointer-events-none ring-4 ring-orange-500/20 flex items-center whitespace-nowrap"
                    >
                        Don't know what to watch? Let me help you!
                        <div className="absolute bottom-[-6px] right-0 w-3 h-3 bg-white rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-full flex items-center justify-center shadow-xl shadow-orange-500/40 text-white relative group mb-16 sm:mb-0"
            >
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                {isOpen ? <X size={28} /> : (
                    <div className="relative">
                        <MessageSquare size={28} />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0a0f1a] rounded-full animate-pulse" />
                    </div>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
                        className="absolute bottom-20 sm:bottom-20 right-0 w-[340px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[85vh] bg-[#0a0f1a]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex flex-col shadow-2xl overflow-hidden shadow-orange-500/10 mb-16 sm:mb-0"
                    >
                        {/* Header */}
                        <div className="p-5 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center justify-between relative">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-xl shadow-orange-500/20">
                                    <Bot className="text-white" size={22} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white tracking-wide text-lg">
                                        Zion AI
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">Active Now</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
                                        <div className={`p-5 rounded-2xl shadow-sm prose prose-invert prose-sm max-w-none ${msg.role === 'user'
                                            ? 'bg-orange-500 text-white rounded-tr-none'
                                            : 'bg-white/5 text-white rounded-tl-none border border-white/5'
                                            }`}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                                                {msg.content}
                                            </ReactMarkdown>

                                            {/* Templates inside the first assistant message */}
                                            {i === 0 && msg.role === 'assistant' && (
                                                <div className="mt-6 flex flex-col gap-2">
                                                    <p className="text-[10px] uppercase tracking-widest font-black text-white/20 mb-2">Pick a starting point</p>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {TEMPLATES.map((tmpl, idx) => (
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
