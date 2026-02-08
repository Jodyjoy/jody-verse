import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
        url: "/opengraph-image.png", // We will add this image next!
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
    images: ["/opengraph-image.png"], // Same image
  },
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
        {children}
      </body>
    </html>
  );
}
