import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const services = [
  {
    id: 'lawn-maintenance',
    image: '/images/lawn-service.png',
    icon: '🌿',
    title: 'Lawn Maintenance',
    description: 'Keep your lawn looking its best year-round with our comprehensive maintenance services. We handle mowing, edging, fertilization, and weed control to ensure a lush, healthy lawn.',
    features: [
      'Weekly or bi-weekly mowing',
      'Professional edging along walkways and beds',
      'Seasonal fertilization programs',
      'Weed and pest control',
      'Grass health monitoring',
    ],
    price: 'Starting at $45/visit',
  },
  {
    id: 'tree-trimming',
    image: '/images/tree-service.png',
    icon: '🌳',
    title: 'Tree Trimming & Care',
    description: 'Professional tree care services to maintain the health, safety, and beauty of your trees. From routine pruning to hazard removal, we handle trees of all sizes.',
    features: [
      'Crown thinning and shaping',
      'Dead branch removal',
      'Storm damage cleanup',
      'Tree health assessments',
      'Stump grinding available',
    ],
    price: 'Starting at $150/tree',
  },
  {
    id: 'sprinkler',
    image: '/images/irrigation-service.png',
    icon: '🚿',
    title: 'Irrigation & Sprinkler Systems',
    description: 'Efficient irrigation is key to a healthy landscape. We install, repair, and maintain sprinkler systems to ensure optimal water distribution and conservation.',
    features: [
      'System inspection and diagnostics',
      'Sprinkler head repair/replacement',
      'Valve and timer programming',
      'Drip irrigation installation',
      'Water efficiency optimization',
    ],
    price: 'Starting at $85/service',
  },
  {
    id: 'fence',
    image: '/images/fence-service.png',
    icon: '🏡',
    title: 'Fence Installation & Repair',
    description: 'Enhance your property with quality fencing solutions. We install and repair various fence types to provide privacy, security, and aesthetic appeal.',
    features: [
      'Wood, vinyl, and metal fencing',
      'Gate installation and repair',
      'Post replacement',
      'Staining and sealing',
      'Custom designs available',
    ],
    price: 'Free estimate required',
  },
  {
    id: 'garden-design',
    image: '/images/garden-service.png',
    icon: '🌺',
    title: 'Garden Design & Planting',
    description: 'Transform your outdoor space with custom garden designs. Our experts create beautiful, sustainable landscapes that thrive in the Santa Ynez Valley climate.',
    features: [
      'Custom landscape design',
      'Native plant selection',
      'Seasonal flower planting',
      'Mulching and bed preparation',
      'Drought-tolerant options',
    ],
    price: 'Starting at $500/project',
  },
  {
    id: 'hardscape',
    image: '/images/hardscape-service.png',
    icon: '🪨',
    title: 'Hardscaping & Pathways',
    description: 'Add structure and functionality to your landscape with professional hardscaping. We create patios, walkways, and outdoor living spaces.',
    features: [
      'Paver patios and walkways',
      'Natural stone installations',
      'Retaining walls',
      'Outdoor lighting integration',
      'Drainage solutions',
    ],
    price: 'Free estimate required',
  },
  {
    id: 'sod-installation',
    image: '/images/sod-service.png',
    icon: '🌱',
    title: 'Sod Installation',
    description: 'Get an instant lawn with our professional sod installation services. We handle everything from site preparation and soil conditioning to laying the sod and initial watering.',
    features: [
      'Premium drought-tolerant sod',
      'Professional soil preparation',
      'Expert grading and drainage',
      'Precision cutting and laying',
      'Establishment care guide',
    ],
    price: 'Starting at $500',
  },
  {
    id: 'trashcaddy',
    image: '/images/trash-bin.png',
    icon: '🗑️',
    title: 'TrashCaddy Service',
    description: 'Never worry about your trash cans again! We\'ll bring your bins to the curb on collection day and return them to storage afterwards.',
    features: [
      'Curbside bin placement on trash day',
      'Return bins to designated storage area',
      'Available as standalone or add-on service',
      'Weekly scheduling aligned with pickup days',
      'Perfect for busy schedules or mobility needs',
    ],
    price: 'Starting at $15/week',
  },
  {
    id: 'dump-services',
    image: '/images/junk-removal.png',
    icon: '🚛',
    title: 'Junk Removal & Hauling',
    description: 'Get rid of yard debris, trash, old furniture, and unwanted items. We load, transport, and dispose responsibly—or donate usable items to Salvation Army on your behalf.',
    features: [
      'Yard debris and green waste removal',
      'Household trash and junk removal',
      'Old furniture and appliance haul-away',
      'Donation drop-off to Salvation Army',
      'Old mulch, soil, and rock disposal',
      'Brush and branch hauling',
      'Broken concrete and pavers',
      'Same-day service available',
    ],
    price: 'Starting at $150/load',
    quoteLink: '/dump-quote',
  },
  {
    id: 'pressure-washing',
    image: '/images/pressure-washing.png',
    icon: '🌊',
    title: 'Pressure Washing',
    description: 'Powerful deep cleaning for all your exterior surfaces. We remove dirt, mold, and stains from driveways, patios, and walkways.',
    features: [
      'Concrete and brick cleaning',
      'Driveway and walkway revitalization',
      'Patio and deck cleaning',
      'Eco-friendly cleaning solutions',
      'Oil and stain removal',
    ],
    price: 'Starting at $199',
  },
  {
    id: 'solar-cleaning',
    image: '/images/solar-cleaning.png',
    icon: '☀️',
    title: 'Solar Panel Cleaning',
    description: 'Maximize your solar energy production with professional cleaning. Dust, bird droppings, and pollen can reduce efficiency by up to 30%.',
    features: [
      'De-ionized water rinse',
      'Streak-free cleaning',
      'Efficiency pre/post check',
      'Safe, non-abrasive methods',
      'Multi-panel discounts',
    ],
    price: 'Starting at $125',
  },
  {
    id: 'bin-cleaning',
    image: '/images/bin-cleaning.png',
    icon: '🧼',
    title: 'Trash Bin Cleaning',
    description: 'Stop the smell and the bacteria. We sanitize, deodorize, and clean your trash and recycling bins inside and out.',
    features: [
      'High-pressure hot water wash',
      'Eco-friendly sanitization',
      'Deodorizing treatment',
      'Convenient curbside service',
      'Monthly or quarterly plans',
    ],
    price: 'Starting at $25/bin',
  },
];

export default function ServicesPage() {
  return (
    <div className={styles.servicesPage}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.heroTag}>Our Services</span>
          <h1 className={styles.heroTitle}>
            Professional Landscaping Services
          </h1>
          <p className={styles.heroSubtitle}>
            Comprehensive outdoor solutions for residential and commercial 
            properties throughout the Santa Ynez Valley
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className={`section-lg ${styles.servicesSection}`}>
        <div className="container">
          <div className={styles.servicesGrid}>
            {services.map((service, index) => (
              <div 
                key={service.id} 
                className={styles.serviceCard}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={styles.serviceImageContainer}>
                  <Image 
                    src={(service as { image: string }).image} 
                    alt={service.title} 
                    fill 
                    className={styles.serviceImage}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className={styles.serviceIconOverlay}>{service.icon}</div>
                </div>
                <div className={styles.serviceHeader}>
                  <h2 className={styles.serviceTitle}>{service.title}</h2>
                </div>
                <p className={styles.serviceDescription}>{service.description}</p>
                <ul className={styles.featureList}>
                  {service.features.map((feature, idx) => (
                    <li key={idx}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className={styles.serviceFooter}>
                  <span className={styles.servicePrice}>{service.price}</span>
                  <Link href={(service as { quoteLink?: string }).quoteLink || "/quote"} className={styles.serviceLink}>
                    {(service as { quoteLink?: string }).quoteLink ? "📸 Get AI Quote" : "Get Quote"}
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
        <div className="container">
          <div className={styles.ctaContent}>
            <h2>Ready to Get Started?</h2>
            <p>Get a free quote for your property in minutes with our online estimator.</p>
            <div className={styles.ctaActions}>
              <Link href="/quote" className="btn btn-accent btn-lg">
                Get Free Quote
              </Link>
              <a href="tel:8052452313" className={styles.ctaPhone}>
                Or call <strong>(805) 245-2313</strong>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
