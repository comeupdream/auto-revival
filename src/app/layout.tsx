import type { Metadata, Viewport } from "next";
import { Cinzel, Jost } from "next/font/google";
import { SHOP } from "@/lib/shop-config";
import "./globals.css";

// Engraved, classical display face — the gold-letter look.
const serif = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

// Clean geometric sans for body & UI.
const sans = Jost({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://revivedetail.autos",
  ),
  title: {
    default: `${SHOP.name} — Premium Auto Detailing`,
    template: `%s · ${SHOP.name}`,
  },
  description: SHOP.tagline,
  openGraph: {
    type: "website",
    siteName: SHOP.name,
    title: `${SHOP.name} — Premium Auto Detailing`,
    description: SHOP.tagline,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: `${SHOP.name} — Premium Auto Detailing`,
    description: SHOP.tagline,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
