import styles from "./page.module.css";

export const metadata = {
  title: "Terms of Service | MM Central Coast Landscaping",
  description:
    "Terms of Service for MM Central Coast Landscaping - the terms and conditions governing use of our services.",
};

export default function TermsPage() {
  return (
    <div className={styles.legalPage}>
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.heroTag}>Legal</span>
          <h1 className={styles.heroTitle}>Terms of Service</h1>
          <p className={styles.heroSubtitle}>
            Last updated: December 2024
          </p>
        </div>
      </section>

      <section className={`section-lg ${styles.contentSection}`}>
        <div className="container">
          <div className={styles.content}>
            <h2>Agreement to Terms</h2>
            <p>
              By accessing or using the services provided by MM Central Coast
              Landscaping, Inc. (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to
              be bound by these Terms of Service. If you do not agree to these
              terms, please do not use our services.
            </p>

            <h2>Services</h2>
            <p>
              We provide professional landscaping services including but not
              limited to:
            </p>
            <ul>
              <li>Lawn maintenance and care</li>
              <li>Tree and shrub trimming</li>
              <li>Irrigation system installation and repair</li>
              <li>Fence installation and repair</li>
              <li>Garden design and planting</li>
              <li>Hardscaping and pathway installation</li>
              <li>Yard cleanup services</li>
              <li>TrashCaddy bin service</li>
            </ul>

            <h2>Online Quotes</h2>
            <p>
              Quotes provided through our website are estimates based on the
              information you provide and satellite imagery analysis. Final
              pricing may vary based on:
            </p>
            <ul>
              <li>On-site property assessment</li>
              <li>Actual property conditions</li>
              <li>Scope of work changes</li>
              <li>Special requirements or obstacles</li>
            </ul>
            <p>
              All quotes are valid for 30 days from the date of issue unless
              otherwise specified.
            </p>

            <h2>Scheduling and Appointments</h2>
            <p>
              Appointments are scheduled based on availability and weather
              conditions. We reserve the right to reschedule appointments due
              to:
            </p>
            <ul>
              <li>Inclement weather</li>
              <li>Equipment issues</li>
              <li>Emergency situations</li>
              <li>Crew availability</li>
            </ul>
            <p>
              We will make reasonable efforts to notify you of any scheduling
              changes as soon as possible.
            </p>

            <h2>Payment Terms</h2>
            <p>
              Payment is due upon completion of services unless otherwise
              agreed. We accept various payment methods including cash, check,
              and major credit cards. For ongoing maintenance services, billing
              is typically monthly in advance.
            </p>

            <h2>Cancellation Policy</h2>
            <p>
              You may cancel or reschedule an appointment with at least 24
              hours notice without penalty. Cancellations with less than 24
              hours notice may be subject to a service fee.
            </p>

            <h2>Property Access</h2>
            <p>
              You agree to provide reasonable access to your property for the
              performance of services. This includes:
            </p>
            <ul>
              <li>Unlocking gates and access points</li>
              <li>Removing obstacles from work areas</li>
              <li>Securing pets during service visits</li>
              <li>Providing access to water sources when needed</li>
            </ul>

            <h2>Liability</h2>
            <p>
              We maintain comprehensive liability insurance for our services.
              However, we are not responsible for:
            </p>
            <ul>
              <li>Pre-existing property conditions</li>
              <li>Underground utilities not marked by property owner</li>
              <li>Damage caused by weather or natural events</li>
              <li>Plant or lawn issues unrelated to our services</li>
            </ul>
            <p>
              Any claims must be reported within 48 hours of service completion.
            </p>

            <h2>Warranty</h2>
            <p>
              We stand behind our work. Installation services include a 90-day
              workmanship warranty. Plant materials are subject to a 30-day
              replacement guarantee when we provide ongoing maintenance.
            </p>

            <h2>Intellectual Property</h2>
            <p>
              All content on our website, including text, images, logos, and
              design elements, is the property of MM Central Coast Landscaping,
              Inc. and is protected by copyright laws.
            </p>

            <h2>Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with
              the laws of the State of California, without regard to conflict
              of law principles.
            </p>

            <h2>Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes
              will be effective upon posting to our website. Continued use of
              our services constitutes acceptance of modified terms.
            </p>

            <h2>Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us:
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
                <br />
                License #101775
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
