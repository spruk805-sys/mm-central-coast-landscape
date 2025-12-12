"use client";

import { useState, useEffect } from "react";
import styles from "./FloatingCTA.module.css";

export default function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Show button after scrolling down a bit
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };

    // Check if mobile
    const checkMobile = () => {
      setIsVisible(window.innerWidth <= 768);
    };

    checkMobile();
    handleScroll();
    
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Only show on mobile and after scrolling
  if (!isVisible) return null;

  return (
    <div className={`${styles.floatingCTA} ${isScrolled ? styles.visible : ""}`}>
      <a href="tel:8052452313" className={styles.callButton}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <span>Call Now</span>
      </a>
      <a href="/quote" className={styles.quoteButton}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h6" />
        </svg>
        <span>Quote</span>
      </a>
    </div>
  );
}
