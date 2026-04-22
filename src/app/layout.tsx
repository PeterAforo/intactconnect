import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntactConnect — Reseller Platform",
  description: "Sell Intact Ghana products and earn commissions as an authorized reseller.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface antialiased">
        {children}
      </body>
    </html>
  );
}
