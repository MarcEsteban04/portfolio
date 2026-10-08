import type { Metadata } from "next";
import { education, experience, profile, skills } from "./profile.ts";

// Where the site is served, for anything that needs a full URL: the sitemap,
// canonical links and share previews.
export const siteUrl = "https://marcestebandev.vercel.app";

// A page's title and description, carried into its canonical link and its
// share previews (Open Graph for most apps, a large card for X). The preview
// images themselves come from each route's opengraph-image.
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: profile.name,
      locale: "en_PH",
      url: path,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Who the site is about, for search engines (schema.org JSON-LD): a Person,
// with where he works and studied and what he knows, and the site itself.
export function personJsonLd() {
  const person = `${siteUrl}/#person`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": person,
        name: profile.name,
        jobTitle: profile.role,
        url: siteUrl,
        image: `${siteUrl}/profile.webp`,
        email: `mailto:${profile.email}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Bocaue",
          addressRegion: "Bulacan",
          addressCountry: "PH",
        },
        worksFor: { "@type": "Organization", name: experience[0].company },
        alumniOf: { "@type": "CollegeOrUniversity", name: education.school },
        knowsAbout: skills.flatMap((group) => group.items),
        sameAs: [`https://github.com/${profile.github}`],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: profile.name,
        author: { "@id": person },
      },
    ],
  };
}
