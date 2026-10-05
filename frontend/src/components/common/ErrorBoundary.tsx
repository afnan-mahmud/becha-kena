import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <AlertOctagon size={48} color="var(--color-error)" style={{ marginBottom: '16px' }} />
          <h2 style={styles.title}>কিছু একটা সমস্যা হয়েছে</h2>
          <p style={styles.message}>দুঃখিত, অপ্রত্যাশিত সমস্যার কারণে পেজটি লোড হতে পারছে না।</p>
          <button style={styles.button} onClick={this.handleRefresh}>
            <RefreshCw size={16} />
            রিফ্রেশ করুন
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    textAlign: 'center' as const,
    backgroundColor: 'var(--color-bg)',
    fontFamily: 'inherit',
  },
  title: {
    fontSize: '1.5rem',
    color: 'var(--color-text-primary)',
    margin: '0 0 8px 0',
  },
  message: {
    color: 'var(--color-text-secondary)',
    marginBottom: '24px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  }
};
