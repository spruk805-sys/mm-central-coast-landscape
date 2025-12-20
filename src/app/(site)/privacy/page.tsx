import styles from "./page.module.css";

export const metadata = {
  title: "Privacy Policy | MM Central Coast Landscaping",
  description:
    "Privacy Policy for MM Central Coast Landscaping - how we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <div className={styles.legalPage}>
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.heroTag}>Legal</span>
          <h1 className={styles.heroTitle}>Privacy Policy</h1>
          <p className={styles.heroSubtitle}>Last updated: December 2024</p>
        </div>
      </section>

      <section className={`section-lg ${styles.contentSection}`}>
        <div className="container">
          <div className={styles.content}>
            <h2>Introduction</h2>
            <p>
              MM Central Coast Landscaping, Inc. (&quot;we,&quot; &quot;our,&quot;
              or &quot;us&quot;) respects your privacy and is committed to
              protecting your personal data. This privacy policy explains how we
              collect, use, and safeguard your information when you visit our
              website or use our services.
            </p>

            <h2>Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul>
              <li>
                <strong>Contact Information:</strong> Name, email address, phone
                number, and physical address when you request a quote or contact
                us.
              </li>
              <li>
                <strong>Property Information:</strong> Address, property size,
                and features related to landscaping services.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact
                with our website, including pages visited and time spent.
              </li>
              <li>
                <strong>Location Data:</strong> Approximate geographic location
                for service area verification.
              </li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide accurate quotes for landscaping services</li>
              <li>Schedule and perform requested services</li>
              <li>Communicate with you about your service requests</li>
              <li>Improve our website and customer experience</li>
              <li>Send promotional communications (with your consent)</li>
            </ul>

            <h2>Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information only in the following
              situations:
            </p>
            <ul>
              <li>With service providers who assist in our operations</li>
              <li>When required by law or legal process</li>
              <li>To protect our rights, privacy, safety, or property</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement appropriate security measures to protect your
              personal information from unauthorized access, alteration,
              disclosure, or destruction. However, no method of transmission
              over the internet is 100% secure.
            </p>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of marketing communications</li>
            </ul>

            <h2>Cookies</h2>
            <p>
              Our website may use cookies to enhance your browsing experience.
              You can control cookie settings through your browser preferences.
            </p>

            <h2>Third-Party Services</h2>
            <p>
              We use Google Maps for property location and measurement features.
              Your use of these features is subject to Google&apos;s Privacy
              Policy.
            </p>

            <h2>Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to individuals under 18 years of
              age. We do not knowingly collect personal information from
              children.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will
              be posted on this page with an updated revision date.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this privacy policy or our data
              practices, please contact us at:
            </p>
            <div className={styles.contactInfo}>
              <p>
                <strong>MM Central Coast Landscaping, Inc.</strong>
                <br />
                Solvang, California
                <br />
                Phone: (805) 245-2313
                <br />
                Email: mmedina3@outlook.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
