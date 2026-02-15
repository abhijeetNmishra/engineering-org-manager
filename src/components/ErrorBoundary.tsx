// Deploy trigger: 2026-02-14
import React from 'react';
import { Button, Result } from 'antd';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global error boundary to catch unhandled React errors
 * and display a friendly fallback UI instead of a blank screen.
 */
export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'var(--bg-primary)',
                }}>
                    <Result
                        status="error"
                        title="Something went wrong"
                        subTitle={
                            this.state.error?.message ||
                            'An unexpected error occurred. Please try again.'
                        }
                        extra={[
                            <Button
                                type="primary"
                                key="retry"
                                onClick={this.handleReset}
                            >
                                Try Again
                            </Button>,
                            <Button
                                key="reload"
                                onClick={() => window.location.reload()}
                            >
                                Reload Page
                            </Button>,
                        ]}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}
