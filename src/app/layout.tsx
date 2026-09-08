import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Aurora from "@/components/Aurora";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcoNexus - Circular Economy Platform",
  description: "AI-powered circular economy for manufacturing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: 'transparent' }}
      >

  {/* Aurora Background */}
  <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
    <Aurora
      colorStops={[
        "#228b22",
        "#2ecc71",
        "#16a085"
      ]}
      amplitude={1.0}
      blend={0.5}
      speed={1}
    />
  </div>


  {/* Content Layer */}
  <AuthProvider>
    <div className="relative z-10 min-h-screen">
      {children}
    </div>
  </AuthProvider>

</body>

    </html>
  );
}