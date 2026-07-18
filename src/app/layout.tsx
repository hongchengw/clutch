import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShipLog — Your commits already tell the story",
  description:
    "Auto standup docs, manager-ready contribution proof, and resume metrics from your GitHub. The dream way to earn your return offer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
