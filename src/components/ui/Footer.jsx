import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Disc, Mail, Send, Play } from 'lucide-react';

export default function Footer() {
    const [currentYear, setCurrentYear] = useState(2024);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="mt-auto border-t border-white/5 bg-background pt-16 pb-8">
            <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2 group w-fit">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all duration-300">
                                <Play className="w-6 h-6 text-white fill-current" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                ZION
                            </span>
                        </Link>
                        <p className="text-muted-foreground leading-relaxed max-w-sm">
                            Your premium destination for streaming entertainment. Experience cinema-quality viewing with advanced features.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Twitter, Instagram, Disc, Mail].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-300 hover:scale-110"
                                >
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-6">Discovery</h3>
                        <ul className="space-y-4">
                            {['Movies', 'TV Shows', 'Trending', 'Top Rated', 'Coming Soon'].map((item) => (
                                <li key={item}>
                                    <Link to="#" className="text-muted-foreground hover:text-orange-500 transition-colors flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-orange-500 transition-colors"></span>
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-6">Support</h3>
                        <ul className="space-y-4">
                            {['Help Center', 'Terms of Service', 'Privacy Policy', 'DMCA', 'Contact Us'].map((item) => (
                                <li key={item}>
                                    <Link to="#" className="text-muted-foreground hover:text-orange-500 transition-colors flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-orange-500 transition-colors"></span>
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
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
