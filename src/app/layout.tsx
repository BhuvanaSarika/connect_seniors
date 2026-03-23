import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "ConnectSeniors — Mentorship Platform by Solvempire",
  description:
    "Professional mentorship platform bridging college seniors and juniors through custom roadmaps, projects, and careers. A Solvempire Private Limited product developed by Tammana Vijaya Manikanta.",
  keywords: ["mentorship", "roadmap", "senior connect", "college projects", "resume review", "solvempire", "manikanta"],
  authors: [{ name: "Tammana Vijaya Manikanta", url: "https://seniors.solvempire.com" }],
  publisher: "Solvempire Private Limited",
  metadataBase: new URL("https://seniors.solvempire.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-light text-foreground">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
