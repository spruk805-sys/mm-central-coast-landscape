'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container" style={{ 
      padding: '100px 20px', 
      textAlign: 'center',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Something went wrong</h1>
      <h2 style={{ marginBottom: '2rem' }}>Our AI is taking a quick breather.</h2>
      <p style={{ marginBottom: '3rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>
        An unexpected error occurred. We've been notified and are working on a fix.
      </p>
      <div style={{ display: 'flex', gap: '20px' }}>
        <button
          onClick={() => reset()}
          className="btn btn-primary"
        >
          Try Again
        </button>
        <Link href="/" className="btn btn-secondary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
