import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { PageHero, Prose, Section } from "../components/Sections";
import { SITE } from "../seo/routes";

export default function Privacy() {
  return (
    <SiteLayout>
      <Seo path="/privacy" crumbs={[{ name: "Privacy policy", path: "/privacy" }]} />
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        intro="What RevFlow collects, why we collect it, and how long we keep it. This policy covers the marketing site, the public demo and the lead forms on both."
        crumbs={[{ name: "Privacy policy", path: "/privacy" }]}
      />

      <Section>
        <Prose>
          <p>
            <strong>Last updated:</strong> 16 November 2026
          </p>

          <h2>Who we are</h2>
          <p>
            RevFlow is operated as part of a Megnitoo.com venture. For any privacy question, contact{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. We are the controller for the personal data described
            below.
          </p>

          <h2>What we collect</h2>
          <h3>Demo accounts</h3>
          <ul>
            <li>Name, work email, hashed password, company, role, use case and team size.</li>
            <li>Terms acceptance, email verification status and onboarding answers.</li>
            <li>Session identifiers stored in an HTTP-only cookie.</li>
            <li>
              Activity inside the demo: tickets created, orders placed, bundles requested, ERP syncs toggled and
              persona switches, recorded with a timestamp for the audit log.
            </li>
          </ul>
          <h3>Lead and contact forms</h3>
          <ul>
            <li>Name, email, company, phone and the message you write.</li>
            <li>Submission metadata: IP address, user agent and the page the form was submitted from.</li>
          </ul>
          <h3>Technical data</h3>
          <ul>
            <li>Server logs containing request paths, status codes, timestamps and IP addresses.</li>
            <li>No advertising trackers, no third-party analytics scripts and no cross-site profiling cookies.</li>
          </ul>

          <h2>Why we use it</h2>
          <ul>
            <li>To create and secure your demo workspace, including email verification and quota enforcement.</li>
            <li>To operate the demo: seeded records, role-based visibility and the activity log.</li>
            <li>To reply to enquiries and send the lead notification to our team.</li>
            <li>To protect the service against abuse, including rate limiting and fraud prevention.</li>
            <li>To meet legal, accounting and security obligations.</li>
          </ul>

          <h2>Retention</h2>
          <p>
            Demo accounts and every record created inside them are purged 14 days after signup. The purge runs on
            startup and every six hours, and removes the user, sessions, usage counters and activity entries. Lead
            submissions are retained for up to 24 months so we can follow up on a conversation, unless you ask us to
            delete them sooner.
          </p>

          <h2>Sharing</h2>
          <p>
            We do not sell personal data. We share it only with infrastructure providers that host the application and
            database, and with our email provider for transactional messages and lead notifications. These providers
            process data on our instructions. We may disclose data where required by law or to protect the rights and
            safety of the service.
          </p>

          <h2>Your choices</h2>
          <ul>
            <li>Request access to, correction of, or deletion of your data by emailing {SITE.email}.</li>
            <li>Withdraw consent for marketing follow-up at any time; transactional demo emails are separate.</li>
            <li>Ask us to delete a demo account before the 14-day window closes.</li>
          </ul>

          <h2>Security</h2>
          <p>
            Passwords are hashed with bcrypt and never stored in plain text. Sessions use HTTP-only cookies. Access to
            the demo is scoped by role, and administrative access to the database is limited to the engineering team.
            No system is perfectly secure, but we design for least privilege and an auditable trail.
          </p>

          <h2>Children</h2>
          <p>
            The service is intended for business users and is not directed at anyone under 18. We do not knowingly
            collect data from children.
          </p>

          <h2>Changes</h2>
          <p>
            If this policy changes materially, we will update the date at the top of this page and, where appropriate,
            notify active demo users by email.
          </p>
        </Prose>
      </Section>
    </SiteLayout>
  );
}
