import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ActionOS — operations software for shelters and community action agencies",
    template: "%s · ActionOS",
  },
  description:
    "ActionOS gives shelter and community action staff role-based dashboards, an AI Action Button that routes what they see to the right place, and the maintenance, inventory and shift-log tools behind it.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
