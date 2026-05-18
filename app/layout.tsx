import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore: CSS module declaration missing in this project setup
import "./globals.css";
import { DownloadProvider } from "../components/DownloadProvider"; 
import { GlobalEffects } from "../components/GlobalEffects"; // 👈 Integrated the cinematic atmosphere engine

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  themeColor: "#030206", // 👈 Updated to match your official Void palette color!
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DownloadProvider>
          {/* 👇 Injected the film grain & custom interactive desktop cursor physics */}
          <GlobalEffects />
          {children}
        </DownloadProvider>
      </body>
    </html>
  );
}