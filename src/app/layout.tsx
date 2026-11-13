import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { profile, seo } from "@/data/profile";
import "./globals.css";

/* Three voices, self-hosted by next/font at build time.
     · Geist            — everything that is read, and the big statements.
     · Instrument Serif — one italic word per statement. The accent voice.
     · Geist Mono       — numbers, IDs, labels. */
const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL(seo.url),
  title: {
    default: seo.title,
    template: `%s · ${profile.name}`,
  },
  description: seo.description,
  keywords: [...seo.keywords],
  authors: [{ name: profile.name, url: profile.links.github }],
  creator: profile.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    title: seo.title,
    description: seo.description,
    url: seo.url,
    siteName: `${profile.name} · Portfolio`,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

/** Structured data — lets search engines resolve the person, not just the page. */
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  email: profile.email,
  url: seo.url,
  description: seo.description,
  sameAs: [
    profile.links.github,
    profile.links.linkedin,
    profile.links.leetcode,
  ],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Vellore Institute of Technology",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Vellore",
    addressRegion: "Tamil Nadu",
    addressCountry: "IN",
  },
  knowsAbout: [
    "Machine Unlearning",
    "Retrieval-Augmented Generation",
    "Multi-Agent Systems",
    "PyTorch",
    "Django",
    "MLOps",
    "LangGraph",
    "Multi-Tenant Architecture",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          // Static, author-controlled object — not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
