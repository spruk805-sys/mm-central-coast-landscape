export default function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LandscapingBusiness",
    name: "MM Central Coast Landscape",
    image: "https://mmcentralcoastlandscape.com/images/logo.png",
    "@id": "https://mmcentralcoastlandscape.com",
    url: "https://mmcentralcoastlandscape.com",
    telephone: "+1-805-245-2313",
    address: {
      "@type": "PostalAddress",
      streetAddress: "",
      addressLocality: "Solvang",
      addressRegion: "CA",
      postalCode: "93463",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 34.5958,
      longitude: -120.1376,
    },
    areaServed: [
      { "@type": "City", name: "Solvang" },
      { "@type": "City", name: "Buellton" },
      { "@type": "City", name: "Santa Ynez" },
      { "@type": "City", name: "Los Olivos" },
      { "@type": "City", name: "Ballard" },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "17:00",
      },
    ],
    sameAs: [],
    priceRange: "$$",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: "127",
    },
    description:
      "Professional landscaping services including lawn maintenance, tree trimming, fence installation, and sprinkler repair. Serving the Santa Ynez Valley for over 29 years.",
    foundingDate: "1995",
    founder: {
      "@type": "Person",
      name: "Miguel Medina",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
