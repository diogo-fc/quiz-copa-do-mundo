import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Copa Quiz Battle - Quiz sobre Copas do Mundo",
    template: "%s | Copa Quiz Battle",
  },
  description:
    "Teste seus conhecimentos sobre a história das Copas do Mundo! Quiz multiplayer com ranking, conquistas e desafios diários.",
  keywords: [
    "copa do mundo",
    "quiz",
    "futebol",
    "trivia",
    "FIFA",
    "World Cup",
    "Brasil",
  ],
  authors: [{ name: "Copa Quiz Battle" }],
  openGraph: {
    title: "Copa Quiz Battle",
    description: "Quiz multiplayer sobre a história das Copas do Mundo",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Copa Quiz Battle - Quiz sobre Copas do Mundo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Copa Quiz Battle",
    description: "Quiz multiplayer sobre a história das Copas do Mundo",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <GoogleAnalytics />
        <AuthProvider>
          {children}
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
