import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Namaste Guntur",
  description: "Food truck order notifications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
