import Link from "next/link";
import styles from "./page.module.css";

const team = [
  {
    name: "Miguel Medina",
    role: "Owner & Lead Landscaper",
    experience: "29+ years experience",
    bio: "Miguel founded MM Central Coast Landscaping with a passion for transforming outdoor spaces. His expertise and dedication to quality have made the company a trusted name in the Santa Ynez Valley.",
  },
];

const values = [
  {
    icon: "🌟",
    title: "Quality First",
    description: "We never compromise on quality. Every job, big or small, receives our full attention and expertise.",
  },
  {
    icon: "🤝",
    title: "Customer Focus",
    description: "Your satisfaction is our priority. We work closely with you to understand and exceed your expectations.",
  },
  {
    icon: "🌱",
    title: "Sustainable Practices",
    description: "We employ eco-friendly methods and recommend drought-tolerant solutions suited to our California climate.",
  },
  {
    icon: "⚡",
    title: "Reliability",
    description: "Count on us to show up on time, every time. We respect your schedule and complete work as promised.",
  },
];

const milestones = [
  { year: "1995", event: "MM Central Coast Landscaping founded in Solvang" },
  { year: "2000", event: "Expanded services to include irrigation systems" },
  { year: "2010", event: "Earned HomeAdvisor Top Rated Pro status" },
  { year: "2015", event: "20th anniversary - 500+ satisfied clients" },
  { year: "2020", event: "Introduced eco-friendly landscape solutions" },
  { year: "2024", event: "Launched AI-powered online quoting system" },
];

export default function AboutPage() {
  return (
    <div className={styles.aboutPage}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.heroTag}>About Us</span>
          <h1 className={styles.heroTitle}>
            29 Years of Excellence
          </h1>
          <p className={styles.heroSubtitle}>
            Creating beautiful landscapes for the Santa Ynez Valley since 1995
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className={`section-lg ${styles.storySection}`}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyImage}>
              <div className={styles.imagePlaceholder}>
                <span>🌿</span>
                <p>Since 1995</p>
              </div>
              <div className={styles.floatingBadge}>
                <span className={styles.badgeValue}>29+</span>
                <span className={styles.badgeLabel}>Years of Service</span>
              </div>
            </div>
            <div className={styles.storyContent}>
              <h2 className={styles.sectionTitle}>Our Story</h2>
              <p className={styles.storyText}>
                MM Central Coast Landscaping was founded in 1995 with a simple mission: 
                to provide exceptional landscaping services that transform outdoor spaces 
                into beautiful, functional areas for families and businesses to enjoy.
              </p>
              <p className={styles.storyText}>
                Over nearly three decades, we&apos;ve grown from a small, local operation 
                into a trusted name throughout the Santa Ynez Valley. Our commitment to 
                quality, reliability, and customer satisfaction has earned us a reputation 
                as the premier landscaping service in the region.
              </p>
              <p className={styles.storyText}>
                Today, we continue to serve our community with the same passion and 
                dedication that started it all. From routine lawn maintenance to complete 
                landscape transformations, we bring expertise and care to every project.
              </p>
              <div className={styles.credentials}>
                <div className={styles.credential}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span>Licensed & Insured</span>
                </div>
                <div className={styles.credential}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <circle cx="12" cy="8" r="7"/>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                  </svg>
                  <span>License #101775</span>
                </div>
                <div className={styles.credential}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>HomeAdvisor Top Rated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={`section ${styles.valuesSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Values</h2>
            <p className={styles.sectionSubtitle}>
              The principles that guide everything we do
            </p>
          </div>
          <div className={styles.valuesGrid}>
            {values.map((value, index) => (
              <div key={index} className={styles.valueCard}>
                <div className={styles.valueIcon}>{value.icon}</div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDescription}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Anthem Section */}
      <section className={`section ${styles.anthemSection}`}>
        <div className="container">
          <div className={styles.anthemContent}>
            <div className={styles.anthemHeader}>
              <span className={styles.sectionSubtitle}>Our Anthem</span>
              <h2 className={styles.sectionTitle}>Roam Through the Coastal Sky</h2>
            </div>
            
            <div className={styles.lyricsCard}>
              <div className={styles.lyricsColumn}>
                <p>
                  Out in the valleys where the wildflowers grow<br/>
                  We’re crafting dreams with every seed we sow<br/>
                  From lawns to gardens, we make &apos;em all shine<br/>
                  For twenty-nine years, giving nature our time
                </p>
                <p className={styles.chorus}>
                  So let’s roam through the coastal sky<br/>
                  With the sun setting low, we’ll never say goodbye<br/>
                  Just you and the landscape so divine<br/>
                  Ooh, I know, I know you’ll love this life
                </p>
              </div>
              <div className={styles.lyricsColumn}>
                <p>
                  Trees trimmed high, where the sweet birds sing<br/>
                  Buellton to Solvang, feel that spring thing<br/>
                  With every project, we’re planting our hearts<br/>
                  Creating spaces, it’s a work of art
                </p>
                <p className={styles.chorus}>
                  So call us up, let’s get it started<br/>
                  For that backyard dream, you’ll be the hardest<br/>
                  With passion and care, we’ll bring it alive<br/>
                  MM Central Coast, feeling that vibe
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`section-lg ${styles.teamSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Meet Our Team</h2>
            <p className={styles.sectionSubtitle}>
              Experienced professionals dedicated to your landscape
            </p>
          </div>
          <div className={styles.teamGrid}>
            {team.map((member, index) => (
              <div key={index} className={styles.teamCard}>
                <div className={styles.teamAvatar}>
                  <span>{member.name.charAt(0)}</span>
                </div>
                <h3 className={styles.teamName}>{member.name}</h3>
                <p className={styles.teamRole}>{member.role}</p>
                <p className={styles.teamExperience}>{member.experience}</p>
                <p className={styles.teamBio}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className={`section ${styles.timelineSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Journey</h2>
            <p className={styles.sectionSubtitle}>
              Key milestones in our history
            </p>
          </div>
          <div className={styles.timeline}>
            {milestones.map((milestone, index) => (
              <div key={index} className={styles.timelineItem}>
                <div className={styles.timelineYear}>{milestone.year}</div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineDot}></div>
                  <p>{milestone.event}</p>
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
            <h2>Ready to Transform Your Landscape?</h2>
            <p>Join hundreds of satisfied customers throughout the Santa Ynez Valley.</p>
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
