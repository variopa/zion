import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    backgroundColor: '#0f172a',
                    color: '#ff6700',
                    minHeight: '100vh',
                    fontFamily: 'monospace',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Something went wrong 💀</h1>
                    <div style={{
                        backgroundColor: 'rgba(255, 103, 0, 0.1)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 103, 0, 0.3)',
                        maxWidth: '800px',
                        width: '100%',
                        overflow: 'auto'
                    }}>
                        <p style={{ color: '#fff', fontSize: '18px', marginBottom: '10px' }}>
                            <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                        </p>
                        <pre style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '30px',
                            padding: '12px 24px',
                            backgroundColor: '#ff6700',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
