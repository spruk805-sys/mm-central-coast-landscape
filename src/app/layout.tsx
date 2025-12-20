import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://mmcentralcoastlandscape.com"),
  title:
    "MM Central Coast Landscaping | Expert Services in Santa Ynez Valley",
  description:
    "Professional landscaping services including yard maintenance, lawn care, tree trimming, fence installation, and sprinkler repair. Serving Solvang, Buellton, Santa Ynez, and Los Olivos for over 29 years.",
  keywords: [
    "landscaping",
    "lawn maintenance",
    "tree trimming",
    "Santa Ynez Valley",
    "Solvang",
    "Buellton",
    "sprinkler repair",
    "fence installation",
  ],
  authors: [{ name: "MM Central Coast Landscaping" }],
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "MM Central Coast Landscaping | Expert Services",
    description:
      "Professional landscaping services for the Santa Ynez Valley. Get a free quote today!",
    type: "website",
    locale: "en_US",
    url: "https://mmcentralcoastlandscape.com",
    images: ["/images/logo.png"],
    siteName: "MM Central Coast Landscaping",
  },
  twitter: {
    card: "summary_large_image",
    title: "MM Central Coast Landscaping | Expert Services",
    description:
      "Professional landscaping services for the Santa Ynez Valley. Get a free quote today!",
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
        <LocalBusinessSchema />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
