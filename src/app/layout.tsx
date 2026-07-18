import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clutch — Your commits already tell the story",
  description:
    "Clutch turns GitHub activity into standups, contribution proof, and manager-ready review packets for interns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="ambient" aria-hidden />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
