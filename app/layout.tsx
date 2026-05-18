import type { Metadata } from "next";
import { Bebas_Neue, Cinzel, DM_Sans } from "next/font/google";
// @ts-ignore: allow side-effect CSS import in Next.js app directory
import "./globals.css";
import { DownloadProvider } from "../components/DownloadProvider"; 
import { GlobalEffects } from "../components/GlobalEffects"; 
import Script from "next/script";

// --- ULTRA-PREMIUM DIGITAL SERIAlIZATION FONTS ---
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Project Rift | The Jody-verse",
  description: "Experience the raw energy of Project Rift and the deep lore of Urithi. The official creative universe of Joseph Kamau.",
  openGraph: {
    title: "Project Rift | The Jody-verse",
    description: "Read the latest manga chapters and novels from the Jody-verse.",
    url: "https://jody-verse.vercel.app",
    siteName: "Jody-verse",
    images: [
      {
        url: "/opengraph-image.png", 
        width: 1200,
        height: 630,
        alt: "Project Rift Banner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Rift | The Jody-verse",
    description: "Read the latest manga chapters and novels from the Jody-verse.",
    images: ["/opengraph-image.png"], 
  },
};

export const viewport = {
  themeColor: "#05030f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebasNeue.variable} ${cinzel.variable} ${dmSans.variable} antialiased`}
        style={{ backgroundColor: "#05030f" }}
      >
        <DownloadProvider>
          <GlobalEffects />
          {children}
        </DownloadProvider>

        {/* 👇 Service Worker Background Boot Loader (Survives post-build injector pipeline) 👇 */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('Rift ServiceWorker online and authorized with scope: ', registration.scope);
                }, function(err) {
                  console.error('ServiceWorker boot crash: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}