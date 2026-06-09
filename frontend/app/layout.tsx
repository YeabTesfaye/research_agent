import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Research Agent",
    template: "%s · Research Agent",
  },
  description: "Four AI agents collaborate to research any topic and produce a structured, cited report in minutes.",
  keywords: ["AI research", "multi-agent", "CrewAI", "research assistant"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f5f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background antialiased selection:bg-accent/10 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}
