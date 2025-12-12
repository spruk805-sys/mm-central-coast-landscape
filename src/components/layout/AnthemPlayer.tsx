"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./AnthemPlayer.module.css";

export default function AnthemPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check if audio file exists or handle error on load
    if (audioRef.current) {
        audioRef.current.onerror = () => {
            console.warn("Audio file not found. Please upload 'jingle.mp3' to public/audio/");
            setError(true);
        };
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Playback failed:", err);
        setError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className={styles.playerContainer}>
      <div className={styles.playerHeader}>
        <div className={styles.iconWrapper}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="21" cy="16" r="3" />
          </svg>
        </div>
        <div>
          <h4 className={styles.playerTitle}>Roam Through the Coastal Sky</h4>
          <p className={styles.playerSubtitle}>MM Central Coast Anthem</p>
        </div>
      </div>

      <div className={styles.controls}>
        <audio
          ref={audioRef}
          src="/audio/jingle.mp3"
          onEnded={handleEnded}
          preload="none"
        />
        <button 
            onClick={togglePlay} 
            className={`${styles.playBtn} ${isPlaying ? styles.isPlaying : ''}`}
            disabled={error}
        >
            {error ? (
                 <>
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                   <circle cx="12" cy="12" r="10"></circle>
                   <line x1="12" y1="8" x2="12" y2="12"></line>
                   <line x1="12" y1="16" x2="12.01" y2="16"></line>
                 </svg>
                 Missing Audio
               </>
            ) : isPlaying ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Pause Anthem
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Play Anthem
            </>
          )}
        </button>
      </div>
      {error && (
        <p className={styles.errorText}>* Audio file missing. Please upload.</p>
      )}
    </div>
  );
}
