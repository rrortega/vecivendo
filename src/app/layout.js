import "./app.css";
import { Inter, Nunito_Sans } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { OfflineNotification } from "@/components/ui/OfflineNotification";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunitoSans = Nunito_Sans({
  weight: ['300', '400', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-nunito"
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vecivendo.com"),
  title: {
    default: "Vecivendo | Marketplace para comunidades",
    template: "%s | Vecivendo"
  },
  description: "El marketplace exclusivo para tu comunidad. Compra y vende seguro con tus vecinos.",
  keywords: ["marketplace", "vecinos", "comunidad", "seguridad", "compra venta", "local"],
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon-32x32.png',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon.png',
    },
  },
  openGraph: {
    title: "Vecivendo | Marketplace para comunidades",
    description: "El marketplace exclusivo para tu comunidad.",
    url: "https://vecivendo.com",
    siteName: "Vecivendo",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vecivendo",
    description: "El marketplace exclusivo para tu comunidad.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vecivendo",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#FD366E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mobile-app like feel
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "Vecivendo",
        "url": "https://vecivendo.com",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://vecivendo.com/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "name": "Vecivendo",
        "url": "https://vecivendo.com",
        "logo": "https://vecivendo.com/vecivendo_logo_primary.png"
      }
    ]
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${nunitoSans.variable} font-sans bg-background text-text-secondary antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <ToastProvider>
            <CartProvider>
              <OfflineNotification />
              {children}
            </CartProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
