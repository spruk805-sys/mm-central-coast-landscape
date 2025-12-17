"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.headerContainer}`}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Image 
              src="/images/logo.png" 
              alt="MM Central Coast Landscape" 
              width={50} 
              height={50}
              priority
            />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>MM Central Coast</span>
            <span className={styles.logoSubtitle}>Landscape</span>
          </div>
        </Link>

        <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ""}`}>
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  className={styles.navLink}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.headerActions}>
          <a href="tel:8052452313" className={styles.phoneLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>(805) 245-2313</span>
          </a>
          <Link href="/quote" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Get AI Quote</span>
            <span>✨</span>
          </Link>
        </div>

        <button 
          className={`${styles.mobileMenuBtn} ${isMobileMenuOpen ? styles.open : ""}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
