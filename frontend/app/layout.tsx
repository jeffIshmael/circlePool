import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CirclePool - Circular Savings & Micro-Lending",
  description: "Transform your savings group into a community bank with CirclePool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} antialiased pb-16 md:pb-0`}
        style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
      >
        <Providers>
          {children}
          <BottomNav />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
