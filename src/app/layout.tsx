import type { Metadata } from "next";
import "./globals.css";
import AuthProviders from "@/components/auth-providers";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Seatbooking - Smart Workspace Booking",
  description:
    "Book your perfect workspace with intelligent seatbook management",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProviders>
          {children}
          <Toaster />
          <SpeedInsights />
        </AuthProviders>
      </body>
    </html>
  );
}
