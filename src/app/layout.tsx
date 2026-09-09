import type { Metadata, Viewport } from "next";
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { profile, seo } from "@/data/profile";
import "./globals.css";

/* Three voices, self-hosted by next/font at build time — no render-blocking
   request to a font CDN.
     · Instrument Serif — the thinking voice: statements and arguments.
     · JetBrains Mono   — the measuring voice: indices, data, annotations.
     · Inter Tight      — reading copy, and nothing else. */
const instrument = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-instrument-serif",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-tight",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
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
  themeColor: "#07080a",
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
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetbrains.variable} ${instrument.variable}`}
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
