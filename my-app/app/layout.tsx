// import type { Metadata } from "next";
// import { Geist, Geist_Mono, Inter } from "next/font/google";
// import "./globals.css";
// import { cn } from "@/lib/utils";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gallery.io — A space for unforgettable work",
  description:
    "Gallery.io helps creators transform their projects into beautiful visual experiences.",
  authors: [{ name: "Gallery.io" }],
  openGraph: {
    title: "Gallery.io — A space for unforgettable work",
    description:
      "Gallery.io helps creators transform their projects into beautiful visual experiences.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}