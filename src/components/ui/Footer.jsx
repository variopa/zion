import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Disc, Mail, Send } from 'lucide-react';

export default function Footer() {
    const [currentYear, setCurrentYear] = useState(2024);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="mt-auto border-t border-white/5 bg-background pt-16 pb-24 lg:pb-12">
            <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="space-y-5">
                        <Link to="/library" className="inline-block group">
                            <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300 group-hover:scale-105 transition-transform duration-300">
                                ZION
                            </h2>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                            Your premium destination for high-definition entertainment.
                            Stream unlimited movies and TV shows in stunning quality.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3 pt-2">
                            {[
                                { name: 'Twitter', icon: Twitter },
                                { name: 'Instagram', icon: Instagram },
                                { name: 'Discord', icon: Disc }
                            ].map((social) => (
                                <a
                                    key={social.name}
                                    href="#"
                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300 hover:scale-110"
                                    aria-label={social.name}
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation - Browse */}
                    <div className="space-y-5">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Browse</h3>
                        <ul className="space-y-3 text-sm">
                            {[
                                { name: 'Home', href: '/library' },
                                { name: 'Movies', href: '/movies' },
                                { name: 'TV Shows', href: '/tv' },
                                { name: 'Genres', href: '/genres' },
                                { name: 'Upcoming', href: '/upcoming' },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link
                                        to={link.href}
                                        className="text-muted-foreground hover:text-orange-500 hover:translate-x-1 inline-block transition-all duration-300"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Navigation - Support */}
                    <div className="space-y-5">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Support</h3>
                        <ul className="space-y-3 text-sm">
                            {[
                                { name: 'Help Center', href: '#' },
                                { name: 'Request Content', href: '#' },
                                { name: 'Terms of Service', href: '#' },
                                { name: 'Privacy Policy', href: '#' },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link
                                        to={link.href}
                                        className="text-muted-foreground hover:text-orange-500 hover:translate-x-1 inline-block transition-all duration-300"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-5">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Stay Updated</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Get notified about the latest releases and exclusive content.
                        </p>
                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all duration-300"
                                />
                            </div>
                            <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                                <Send className="w-4 h-4" />
                                <span>Subscribe</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p>
                        © {currentYear} <span className="font-semibold text-gray-400">ZION Streaming</span>. All rights reserved.
                    </p>

                    <p className="flex items-center gap-1.5">
                        Designed & Developed by
                        <a
                            href="https://variopa.vercel.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-gray-400 hover:text-orange-500 transition-colors duration-300"
                        >
                            Variopa
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
