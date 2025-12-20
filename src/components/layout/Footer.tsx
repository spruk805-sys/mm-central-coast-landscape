import Link from "next/link";
import styles from "./Footer.module.css";
import AnthemPlayer from "./AnthemPlayer";

const services = [
  "Lawn Maintenance",
  "Tree Trimming & Care",
  "Junk Removal & Hauling",
  "Pressure Washing",
  "Solar Panel Cleaning",
  "Trash Bin Cleaning",
  "Irrigation & Sprinklers",
  "Garden Design & Planting",
  "Fence Installation & Repair",
  "Hardscaping & Pathways",
  "Sod Installation",
  "TrashCaddy Service",
];

const serviceAreas = [
  "Solvang",
  "Buellton",
  "Santa Ynez",
  "Los Olivos",
  "Santa Ynez Valley",
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className="container">
          <div className={styles.footerGrid}>
            {/* Company Info */}
            <div className={styles.footerSection}>
              <div className={styles.footerLogo}>
                <div className={styles.logoIcon}>
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.2"/>
                    <path d="M20 8C20 8 12 14 12 22C12 26.4183 15.5817 30 20 30C24.4183 30 28 26.4183 28 22C28 14 20 8 20 8Z" fill="currentColor"/>
                    <path d="M20 16L22 20H18L20 16Z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <h3 className={styles.logoTitle}>MM Central Coast Landscaping</h3>
                  <p className={styles.license}>License #101775</p>
                </div>
              </div>
              <p className={styles.description}>
                Expert landscaping services for the Santa Ynez Valley for over 29 years. 
                Your outdoor spaces deserve the best care.
              </p>
              
              {/* Brand Anthem Player */}
              <AnthemPlayer />

              <div className={styles.contact}>
                <a href="tel:8052452313" className={styles.contactItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  (805) 245-2313
                </a>
                <a href="mailto:mmedina3@outlook.com" className={styles.contactItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  mmedina3@outlook.com
                </a>
                <div className={styles.contactItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Solvang, California
                </div>
              </div>
            </div>

            {/* Services */}
            <div className={styles.footerSection}>
              <h4 className={styles.sectionTitle}>Our Services</h4>
              <ul className={styles.linkList}>
                {services.map((service) => (
                  <li key={service}>
                    <Link href="/services" className={styles.link}>
                      {service}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Service Areas */}
            <div className={styles.footerSection}>
              <h4 className={styles.sectionTitle}>Service Areas</h4>
              <ul className={styles.linkList}>
                {serviceAreas.map((area) => (
                  <li key={area}>
                    <span className={styles.areaItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {area}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hours & CTA */}
            <div className={styles.footerSection}>
              <h4 className={styles.sectionTitle}>Business Hours</h4>
              <div className={styles.hours}>
                <div className={styles.hoursRow}>
                  <span>Monday - Friday</span>
                  <span>8:00 AM - 5:00 PM</span>
                </div>
                <div className={styles.hoursRow}>
                  <span>Saturday</span>
                  <span>By Appointment</span>
                </div>
                <div className={styles.hoursRow}>
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
              <Link href="/quote" className={`btn btn-accent ${styles.ctaBtn}`}>
                Get Your Free Quote
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.footerBottom}>
        <div className="container">
          <div className={styles.bottomContent}>
            <p className={styles.copyright}>
              © {currentYear} MM Central Coast Landscaping, Inc. All Rights Reserved.
            </p>
            <div className={styles.bottomLinks}>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <a 
                href="https://www.homeadvisor.com/rated.MMLandscape.58467068.html" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                HomeAdvisor Reviews
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
