import type { Metadata } from "next";
import { Space_Mono, Rajdhani } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-rajdhani",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LUMINA FLOW",
  description: "High-Performance AI Urban Digital Twin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceMono.variable} ${rajdhani.variable} antialiased bg-lumina-black text-lumina-platinum`}
      >
        {children}
      </body>
    </html>
  );
}
