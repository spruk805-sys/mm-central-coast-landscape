import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

const serviceAreas = [
  { name: "Solvang", image: "/images/city-solvang.png" },
  { name: "Buellton", image: "/images/city-buellton.png" },
  { name: "Santa Ynez", image: "/images/city-santa-ynez.png" },
  { name: "Los Olivos", image: "/images/city-los-olivos.png" },
  { name: "Ballard", image: "/images/city-ballard.png" },
  { name: "Santa Barbara County", image: "/images/city-santa-barbara.png" },
];


const services = [
  {
    icon: "🌿",
    title: "Lawn Maintenance",
    description: "Regular mowing, edging, and lawn care to keep your yard pristine year-round.",
    image: "/images/lawn-service.png",
  },
  {
    icon: "🌳",
    title: "Tree Trimming",
    description: "Professional pruning and shaping to maintain healthy, beautiful trees.",
    image: "/images/tree-service.png",
  },
  {
    icon: "🚿",
    title: "Sprinkler Repair",
    description: "Expert irrigation system repair and installation for efficient water management.",
    image: "/images/irrigation-service.png",
  },
  {
    icon: "🏡",
    title: "Fence Installation",
    description: "Quality fencing solutions for privacy, security, and aesthetic appeal.",
    image: "/images/fence-service.png",
  },
  {
    icon: "🌺",
    title: "Garden Design",
    description: "Custom landscape designs that transform your outdoor space into a paradise.",
    image: "/images/garden-service.png",
  },
  {
    icon: "🚛",
    title: "Junk Removal",
    description: "Full-service hauling for furniture, appliances, and yard debris. We load, you relax.",
    image: "/images/cleanup-service.png",
  },
  {
    icon: "🗑️",
    title: "TrashCaddy Service",
    description: "We bring your bins to the curb and back — never miss trash day again.",
    image: "/images/trash-bin.png",
  },
  {
    icon: "☀️",
    title: "Solar Panel Cleaning",
    description: "Maximize your energy efficiency with professional, streak-free solar panel cleaning.",
    image: "/images/solar-cleaning.png",
  },
  {
    icon: "💧",
    title: "Pressure Washing",
    description: "Revitalize your driveway, patio, and walkways with high-power deep cleaning.",
    image: "/images/pressure-washing.png",
  },
  {
    icon: "🧼",
    title: "Trash Bin Cleaning",
    description: "Sanitize and deodorize your trash bins. We eliminate bacteria and bad smells.",
    image: "/images/bin-cleaning.png",
  },
];

const stats = [
  { value: "29+", label: "Years Experience" },
  { value: "1000+", label: "Happy Clients" },
  { value: "5★", label: "HomeAdvisor Rating" },
  { value: "100%", label: "Satisfaction" },
];

const differentiators = [
  {
    icon: "🏆",
    title: "29 Years of Local Expertise",
    description: "Not some fly-by-night operation. We've been transforming Santa Ynez Valley properties since 1995.",
  },
  {
    icon: "💯",
    title: "Owner-Operated Quality",
    description: "Miguel personally oversees every project. No subcontractors, no surprises — just consistent excellence.",
  },
  {
    icon: "⚡",
    title: "Same-Week Service",
    description: "While others make you wait weeks, we respond fast. Most quotes within 24 hours, service within days.",
  },
  {
    icon: "🎯",
    title: "AI-Powered Instant Quotes",
    description: "Get accurate pricing in minutes, not days. Our smart estimator analyzes your property for precise quotes.",
  },
];

const testimonials = [
  {
    quote: "MM Central Coast Landscape transformed our backyard into an oasis. Their attention to detail is unmatched!",
    author: "Sarah M.",
    location: "Solvang, CA",
  },
  {
    quote: "Reliable, professional, and always on time. We've used them for years and couldn't be happier.",
    author: "John D.",
    location: "Buellton, CA",
  },
  {
    quote: "The best landscaping service in the Santa Ynez Valley. Highly recommend for any yard work!",
    author: "Maria L.",
    location: "Santa Ynez, CA",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroOverlay}></div>
        </div>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroMain}>
            <div className={styles.heroBadge}>
              <span className={styles.badgePulse}></span>
              <span>🏆 #1 Rated Landscaper in Santa Ynez Valley</span>
            </div>
            <h1 className={styles.heroTitle}>
              The Yard You&apos;ve 
              <span className={styles.heroHighlight}> Always Wanted</span>
            </h1>
            <p className={styles.heroSubtitle}>
              <strong>29 years.</strong> 1,000+ properties. One simple promise: 
              your lawn will be the envy of the neighborhood — or we make it right.
            </p>
            <div className={styles.heroActions}>
              <Link href="/quote" className="btn btn-accent btn-lg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '12px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Instant AI Quote</span>
                </div>
                <span style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: 'normal' }}> ✨ Satellite Property Analysis</span>
              </Link>
              <a href="tel:8052452313" className="btn btn-secondary btn-lg">
                📞 (805) 245-2313
              </a>
            </div>
            <div className={styles.heroGuarantee}>
              <div className={styles.guaranteeItem}>
                <span className={styles.guaranteeIcon}>✓</span>
                <span>Free Estimates</span>
              </div>
              <div className={styles.guaranteeItem}>
                <span className={styles.guaranteeIcon}>✓</span>
                <span>Licensed & Insured</span>
              </div>
              <div className={styles.guaranteeItem}>
                <span className={styles.guaranteeIcon}>✓</span>
                <span>Satisfaction Guaranteed</span>
              </div>
            </div>
          </div>
          <div className={styles.heroTrust}>
            <a 
              href="https://www.homeadvisor.com/rated.MMLandscape.58467068.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.trustBadge}
            >
              <div className={styles.trustIcon}>⭐</div>
              <div>
                <span className={styles.trustLabel}>HomeAdvisor</span>
                <span className={styles.trustValue}>Top Rated Pro</span>
              </div>
            </a>
            <div className={styles.trustDivider}></div>
            <div className={styles.trustBadge}>
              <div className={styles.trustIcon}>📜</div>
              <div>
                <span className={styles.trustLabel}>CA License</span>
                <span className={styles.trustValue}>#101775</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.heroScroll}>
          <span>See why we&apos;re different</span>
          <div className={styles.scrollIndicator}>
            <div className={styles.scrollDot}></div>
          </div>
        </div>
      </section>

      {/* Why We're Different - NEW SECTION */}
      <section className={styles.differentiators}>
        <div className="container">
          <div className={styles.diffHeader}>
            <span className={styles.diffTag}>Why Homeowners Choose Us Over Big Companies</span>
            <h2 className={styles.diffTitle}>
              We&apos;re Not Your Average<br/>Landscaping Company
            </h2>
          </div>
          <div className={styles.diffGrid}>
            {differentiators.map((diff, index) => (
              <div key={index} className={styles.diffCard}>
                <div className={styles.diffIcon}>{diff.icon}</div>
                <h3>{diff.title}</h3>
                <p>{diff.description}</p>
              </div>
            ))}
          </div>
          <div className={styles.diffCta}>
            <p className={styles.diffCtaText}>
              <strong>Still comparing options?</strong> Get your free quote in 2 minutes and see the MM difference.
            </p>
            <Link href="/quote" className="btn btn-primary btn-lg">
              Get My Free Quote →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={`section-lg ${styles.services}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>What We Offer</span>
            <h2 className={styles.sectionTitle}>
              Professional Landscaping Services
            </h2>
            <p className={styles.sectionSubtitle}>
              From routine maintenance to complete landscape transformations, 
              we handle it all with expert care and attention to detail.
            </p>
          </div>
          <div className={styles.servicesGrid}>
            {services.map((service, index) => (
              <div 
                key={index} 
                className={styles.serviceCard}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={styles.serviceImageWrapper}>
                  <Image 
                    src={service.image}
                    alt={service.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className={styles.serviceIconOverlay}>
                    <span>{service.icon}</span>
                  </div>
                </div>
                <div className={styles.serviceContent}>
                  <h3 className={styles.serviceTitle}>{service.title}</h3>
                  <p className={styles.serviceDescription}>{service.description}</p>
                  <Link href="/services" className={styles.serviceLink}>
                    Learn More
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaBackground}></div>
        <div className={`container ${styles.ctaContent}`}>
          <div className={styles.ctaText}>
            <h2>Ready to Transform Your Property?</h2>
            <p>
              Get an instant quote using our AI-powered estimator. 
              Simply enter your address and let us analyze your property 
              to provide accurate pricing.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/quote" className="btn btn-accent btn-lg">
              Get Your Free Quote
            </Link>
            <a href="tel:8052452313" className={styles.ctaPhone}>
              Or call us at <strong>(805) 245-2313</strong>
            </a>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className={`section-lg ${styles.whyUs}`}>
        <div className="container">
          <div className={styles.whyUsGrid}>
            <div className={styles.whyUsContent}>
              <span className={styles.sectionTag}>Why Choose Us</span>
              <h2 className={styles.sectionTitle}>
                29 Years of Excellence in Landscaping
              </h2>
              <p className={styles.whyUsText}>
                MM Central Coast Landscape has been the trusted choice for 
                property owners throughout the Santa Ynez Valley. Our 
                commitment to quality, reliability, and customer satisfaction 
                has earned us a reputation as the premier landscaping service 
                in the region.
              </p>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <div className={styles.featureIcon}>✓</div>
                  <div>
                    <strong>Licensed & Insured</strong>
                    <span>Full coverage for your peace of mind</span>
                  </div>
                </li>
                <li className={styles.featureItem}>
                  <div className={styles.featureIcon}>✓</div>
                  <div>
                    <strong>Experienced Team</strong>
                    <span>Skilled professionals who care about results</span>
                  </div>
                </li>
                <li className={styles.featureItem}>
                  <div className={styles.featureIcon}>✓</div>
                  <div>
                    <strong>Free Estimates</strong>
                    <span>Transparent pricing with no hidden fees</span>
                  </div>
                </li>
                <li className={styles.featureItem}>
                  <div className={styles.featureIcon}>✓</div>
                  <div>
                    <strong>100% Satisfaction</strong>
                    <span>We&apos;re not happy until you are</span>
                  </div>
                </li>
              </ul>
              <Link href="/about" className="btn btn-primary">
                Learn More About Us
              </Link>
            </div>
            <div className={styles.whyUsImage}>
              <div className={styles.imageFrame}>
                <Image 
                  src="/images/gallery-1.jpg"
                  alt="Beautiful landscape work by MM Central Coast Landscape"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className={styles.imageOverlay}>
                  <p>Beautiful Landscapes Since 1995</p>
                </div>
              </div>
              <div className={styles.floatingCard}>
                <div className={styles.floatingIcon}>🌟</div>
                <div>
                  <span className={styles.floatingValue}>Top Rated</span>
                  <span className={styles.floatingLabel}>on HomeAdvisor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`section ${styles.testimonials}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Testimonials</span>
            <h2 className={styles.sectionTitle}>What Our Clients Say</h2>
          </div>
          <div className={styles.testimonialsGrid}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className={styles.testimonialCard}>
                <div className={styles.testimonialQuote}>&ldquo;</div>
                <p className={styles.testimonialText}>{testimonial.quote}</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.authorAvatar}>
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <span className={styles.authorName}>{testimonial.author}</span>
                    <span className={styles.authorLocation}>{testimonial.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className={`section ${styles.areas}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Coverage Area</span>
            <h2 className={styles.sectionTitle}>Proudly Serving Santa Ynez Valley</h2>
            <p className={styles.sectionSubtitle}>
              We provide expert landscaping services throughout the beautiful Santa Ynez Valley and surrounding areas.
            </p>
          </div>
          <div className={styles.areasGrid}>
            {serviceAreas.map((area, index) => (
              <div key={index} className={styles.areaCard}>
                <div className={styles.areaImageWrapper}>
                  <Image 
                    src={area.image} 
                    alt={area.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                  <div className={styles.areaOverlay}>
                    <span className={styles.areaPin}>📍</span>
                  </div>
                </div>
                <span className={styles.areaName}>{area.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className="container">
          <div className={styles.finalCtaContent}>
            <h2>Let&apos;s Create Your Dream Landscape</h2>
            <p>Contact us today for a free consultation and estimate.</p>
            <div className={styles.finalCtaActions}>
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
    </>
  );
}
