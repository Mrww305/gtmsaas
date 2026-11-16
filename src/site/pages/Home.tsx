import HomeSections from "../../App";
import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { SITE } from "../seo/routes";

export default function Home() {
  return (
    <SiteLayout>
      <Seo
        path="/"
        extra={[
          {
            "@type": "Organization",
            "@id": `${SITE.url}/#organization`,
            name: "RevFlow",
            url: SITE.url,
            email: SITE.email,
            description:
              "Revenue operations platform for multi-entity groups, combining B2C appliance operations with B2B conglomerate pipeline.",
            parentOrganization: { "@type": "Organization", name: "Megnitoo.com", url: "https://megnitoo.com" },
            founder: { "@id": `${SITE.url}/#creator` },
          },
          {
            "@type": "SoftwareApplication",
            name: "RevFlow",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: SITE.url,
            description:
              "Multi-tenant revenue operations platform with GTM canvas, channel distribution, field service dispatch and ERP sync.",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              lowPrice: "249",
              highPrice: "749",
              offerCount: "2",
            },
          },
        ]}
      />
      <HomeSections />
    </SiteLayout>
  );
}
