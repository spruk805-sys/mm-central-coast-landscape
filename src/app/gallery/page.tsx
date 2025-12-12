import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

// Gallery items with real images from the website
const galleryItems = [
  { id: 1, category: "lawns", title: "Lawn Maintenance", location: "Solvang, CA", image: "/images/real-work-1.jpg" },
  { id: 2, category: "hardscape", title: "Patio & Pathway", location: "Santa Ynez, CA", image: "/images/real-work-2.jpg" },
  { id: 3, category: "lawns", title: "Pristine Lawn Care", location: "Los Olivos, CA", image: "/images/hero-stock.jpg" },
  // Duplicate usage for demonstration until more photos are available
  { id: 4, category: "trees", title: "Tree Trimming", location: "Solvang, CA", image: "/images/real-work-1.jpg" }, 
  { id: 5, category: "gardens", title: "Garden Design", location: "Buellton, CA", image: "/images/real-work-2.jpg" },
];

const categories = [
  { id: "all", label: "All Projects" },
  { id: "lawns", label: "Lawns" },
  { id: "gardens", label: "Gardens" },
  { id: "trees", label: "Trees" },
  { id: "hardscape", label: "Hardscape" },
];

export default function GalleryPage() {
  return (
    <div className={styles.galleryPage}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.heroTag}>Our Work</span>
          <h1 className={styles.heroTitle}>Project Gallery</h1>
          <p className={styles.heroSubtitle}>
            Browse our portfolio of completed landscaping projects throughout the Santa Ynez Valley
          </p>
        </div>
      </section>

      {/* Gallery Section */}
      <section className={`section-lg ${styles.gallerySection}`}>
        <div className="container">
          {/* Filter */}
          <div className={styles.filterBar}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.filterBtn} ${cat.id === 'all' ? styles.active : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className={styles.galleryGrid}>
            {galleryItems.map((item, index) => (
              <div 
                key={item.id} 
                className={styles.galleryCard}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={styles.cardImage}>
                  <Image 
                    src={item.image} 
                    alt={item.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className={styles.cardOverlay}>
                    <span className={styles.categoryTag}>{item.category}</span>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardLocation}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {item.location}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className={styles.loadMore}>
            <button className="btn btn-secondary">
              Load More Projects
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2>Ready to Start Your Project?</h2>
            <p>Let us create something beautiful for your property.</p>
            <div className={styles.ctaActions}>
              <Link href="/quote" className="btn btn-accent btn-lg">
                Get Free Quote
              </Link>
              <Link href="/contact" className="btn btn-secondary btn-lg">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
