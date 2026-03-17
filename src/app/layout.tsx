import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "degenVerse",
  description: "CREATED BY 0x_hon",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/logo.jpg" />
        {/* Optional: multiple sizes */}
        <link rel="icon" type="image/jpg" sizes="32x32" href="/logo.jpg" />
        <link rel="icon" type="image/jpg" sizes="16x16" href="/logo.jpg" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
