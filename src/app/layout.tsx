import type { Metadata } from "next";
import "./globals.css";
import AuthProviders from "@/components/auth-providers";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "RoomBook - Smart Workspace Booking",
  description: "Book your perfect workspace with intelligent room management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
        <AuthProviders session={null}>
          {children}
          <Toaster />
        </AuthProviders>
      </body>
    </html>
  );
}
