import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6 text-center">
                    <div className="max-w-md w-full space-y-6 bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold">Something went wrong</h2>

                        <p className="text-gray-400 text-sm">
                            The application encountered an unexpected error. This might be a temporary glitch.
                        </p>

                        {/* Development Message (Optional) */}
                        <div className="text-xs text-left bg-black/50 p-4 rounded-lg font-mono text-red-300 overflow-auto max-h-32 opacity-80">
                            {this.state.error && this.state.error.toString()}
                        </div>

                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 rounded-xl"
                        >
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Reload Application
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
