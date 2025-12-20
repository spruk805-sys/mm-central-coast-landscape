'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function NotFound() {
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
      <h1 className="hero-title" style={{ fontSize: '5rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ marginBottom: '2rem' }}>Oops! This page has vanished like a trimmed lawn.</h2>
      <p style={{ marginBottom: '3rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>
        We couldn't find the page you're looking for. It might have been moved or doesn't exist anymore.
      </p>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
        <Link href="/quote" className="btn btn-accent">
          Get a Quote
        </Link>
      </div>
    </div>
  );
}
