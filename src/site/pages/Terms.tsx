import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { PageHero, Prose, Section } from "../components/Sections";
import { SITE } from "../seo/routes";

export default function Terms() {
  return (
    <SiteLayout>
      <Seo path="/terms" crumbs={[{ name: "Terms of use", path: "/terms" }]} />
      <PageHero
        eyebrow="Legal"
        title="Terms of use"
        intro="The rules that apply when you browse this site, create a demo account or use the evaluation workspace."
        crumbs={[{ name: "Terms of use", path: "/terms" }]}
      />

      <Section>
        <Prose>
          <p>
            <strong>Last updated:</strong> 16 November 2026
          </p>

          <h2>1. Agreement</h2>
          <p>
            By accessing {SITE.url} or creating a demo account, you agree to these terms. If you are using the service
            on behalf of a company, you confirm you are authorised to bind that company. If you do not agree, do not use
            the site or the demo.
          </p>

          <h2>2. The demo is an evaluation environment</h2>
          <ul>
            <li>The public demo runs against a shared, seeded dataset. Records you create are visible to the workspace and may be reset.</li>
            <li>Demo accounts and their records are deleted 14 days after signup, without notice and without export.</li>
            <li>Daily action quotas apply and may change to keep the environment available for all visitors.</li>
            <li>The demo is provided for evaluation only and must not be used to store real customer, financial or personal data.</li>
          </ul>

          <h2>3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Attempt to access another user's workspace, escalate your role or bypass quotas.</li>
            <li>Probe, scan or test the vulnerability of the service without written permission.</li>
            <li>Use the service to send unlawful, deceptive or unsolicited communications.</li>
            <li>Upload malware, scrape the service at scale or interfere with its normal operation.</li>
            <li>Resell, sublicense or white-label the service without a written agreement.</li>
          </ul>

          <h2>4. Accounts and security</h2>
          <p>
            You are responsible for the accuracy of the details you provide and for keeping your password confidential.
            Notify us immediately at {SITE.email} if you suspect unauthorised access. We may suspend an account that
            appears compromised or abusive.
          </p>

          <h2>5. Intellectual property</h2>
          <p>
            The platform, the site content, the seeded dataset and the underlying code are owned by RevFlow and its
            licensors. You receive a limited, non-exclusive, non-transferable right to use the demo for evaluation.
            Feedback you send us may be used to improve the product without obligation.
          </p>

          <h2>6. Third-party services</h2>
          <p>
            The service references and can exchange data with third-party systems such as SAP, Oracle NetSuite,
            Microsoft Dynamics 365 and WhatsApp Business. Your use of those systems is governed by their own terms. We
            are not responsible for their availability, pricing or data practices.
          </p>

          <h2>7. No warranty</h2>
          <p>
            The demo and this website are provided "as is" and "as available", without warranties of any kind, express
            or implied, including merchantability, fitness for a particular purpose and non-infringement. Figures shown
            in the demo are illustrative and are not a commercial offer.
          </p>

          <h2>8. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, RevFlow is not liable for indirect, incidental, special,
            consequential or punitive damages, or for lost profits, revenue, data or goodwill, arising from your use of
            the demo or site. Our total liability for any claim is limited to the greater of the amount you paid us in
            the twelve months before the claim or PKR 25,000.
          </p>

          <h2>9. Termination</h2>
          <p>
            We may suspend or terminate access at any time if these terms are breached or if the environment needs to
            be reset. You may stop using the service at any time and request deletion of your account.
          </p>

          <h2>10. Governing law</h2>
          <p>
            These terms are governed by the laws of Pakistan, and the courts of Lahore have exclusive jurisdiction over
            any dispute, without prejudice to any mandatory consumer protection rules that may apply.
          </p>

          <h2>11. Changes</h2>
          <p>
            We may update these terms as the product evolves. The date at the top of this page reflects the current
            version, and continued use after an update constitutes acceptance.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions about these terms: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>
        </Prose>
      </Section>
    </SiteLayout>
  );
}
