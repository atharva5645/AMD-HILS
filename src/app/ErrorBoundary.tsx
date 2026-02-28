import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Unhandled UI error:', error, errorInfo)
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-hils-bg px-6">
                    <div className="glass-card p-6 max-w-md w-full text-center">
                        <h1 className="text-lg font-semibold text-hils-text mb-2">Something went wrong</h1>
                        <p className="text-sm text-hils-text-muted mb-5">
                            The app hit an unexpected error. Reload to continue.
                        </p>
                        <button type="button" className="btn-primary" onClick={this.handleReload}>
                            Reload App
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
