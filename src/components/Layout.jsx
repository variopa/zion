import Navbar from './ui/Navbar';
import Footer from './ui/Footer';
import BottomNav from './ui/BottomNav';


export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col scroll-smooth">
            <Navbar />
            <main className="flex-1 w-full pt-16 lg:pt-24">
                {children}
            </main>
            <Footer />
            <BottomNav />
        </div>
    );
}
