"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isSubmitted) {
    return (
      <div className={styles.contactPage}>
        <div className={styles.hero}>
          <div className="container">
            <span className={styles.heroTag}>Contact Us</span>
            <h1 className={styles.heroTitle}>Thank You!</h1>
            <p className={styles.heroSubtitle}>
              We&apos;ve received your message and will get back to you shortly.
            </p>
          </div>
        </div>
        <section className={`section ${styles.successSection}`}>
          <div className="container">
            <div className={styles.successCard}>
              <div className={styles.successIcon}>✅</div>
              <h2>Message Sent Successfully</h2>
              <p>We typically respond within 24 hours. In the meantime, feel free to:</p>
              <div className={styles.successActions}>
                <a href="tel:8052452313" className="btn btn-primary">
                  Call Us Now
                </a>
                <a href="/quote" className="btn btn-secondary">
                  Get an Instant Quote
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.contactPage}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.heroTag}>Contact Us</span>
          <h1 className={styles.heroTitle}>Get In Touch</h1>
          <p className={styles.heroSubtitle}>
            Have questions? We&apos;d love to hear from you. Send us a message 
            and we&apos;ll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className={`section-lg ${styles.contactSection}`}>
        <div className="container">
          <div className={styles.contactGrid}>
            {/* Contact Form */}
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Send Us a Message</h2>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>Your Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={styles.input}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={styles.input}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="(805) 555-1234"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="service" className={styles.label}>Service Interested In</label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className={styles.select}
                    >
                      <option value="">Select a service...</option>
                      <option value="lawn-maintenance">Lawn Maintenance</option>
                      <option value="tree-trimming">Tree Trimming</option>
                      <option value="sprinkler">Sprinkler Systems</option>
                      <option value="fence">Fence Installation</option>
                      <option value="garden-design">Garden Design</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message" className={styles.label}>Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className={styles.textarea}
                    placeholder="Tell us about your project or questions..."
                    rows={5}
                  />
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className={styles.spinner}></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className={styles.infoSection}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}>Contact Information</h3>
                <div className={styles.infoList}>
                  <a href="tel:8052452313" className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Phone</span>
                      <span className={styles.infoValue}>(805) 245-2313</span>
                    </div>
                  </a>
                  <a href="mailto:mmedina3@outlook.com" className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoValue}>mmedina3@outlook.com</span>
                    </div>
                  </a>
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Location</span>
                      <span className={styles.infoValue}>Solvang, California</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.hoursCard}>
                <h3 className={styles.infoTitle}>Business Hours</h3>
                <div className={styles.hoursList}>
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
              </div>

              <div className={styles.quickQuote}>
                <h3>Want a Faster Response?</h3>
                <p>Get an instant quote with our online estimator!</p>
                <a href="/quote" className="btn btn-accent">
                  Get Instant Quote
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className={styles.areasSection}>
        <div className="container">
          <h2 className={styles.areasTitle}>We Proudly Serve</h2>
          <div className={styles.areasGrid}>
            {["Solvang", "Buellton", "Santa Ynez", "Los Olivos", "Ballard", "Santa Barbara County"].map((area) => (
              <div key={area} className={styles.areaCard}>
                <span className={styles.areaIcon}>📍</span>
                <span className={styles.areaName}>{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
