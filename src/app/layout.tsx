import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShipLog",
  description:
    "Your commits already tell the story. We write the review.",
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
