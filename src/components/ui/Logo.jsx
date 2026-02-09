import { Link } from 'react-router-dom';

export default function Logo({ className = '' }) {
    return (
        <Link to="/library" className={`flex items-center gap-2 ${className}`}>
            <div className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0 blur-xl bg-gradient-to-r from-orange-500 to-red-600 opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse"></div>

                {/* Logo text - Increased Size */}
                <h1 className="relative text-4xl lg:text-5xl font-black tracking-tighter gradient-text-animated leading-none">
                    ZION
                </h1>
            </div>

            {/* Tagline */}
            <span className="hidden md:block text-[10px] text-gray-400 font-medium mt-1.5 tracking-widest uppercase self-end mb-1">
                Stream
            </span>
        </Link>
    );
}
