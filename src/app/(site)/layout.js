import "../app.css";
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

import { tablesDB } from "@/lib/server/appwrite";
import { Query } from "node-appwrite";
import parse from "html-react-parser";

async function getGlobalScripts() {
  try {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "configuracion_global";

    // Using server-side SDK (node-appwrite) with TablesDB
    const response = await tablesDB.listRows({
      databaseId: dbId,
      tableId: collectionId,
      queries: [
        Query.limit(1)
      ]
    });

    if (response.rows.length > 0) {
      const doc = response.rows[0];
      console.log("Global scripts fetched successfully"); // Debug log relative to system, visible in server logs
      return {
        header: doc.scripts_header || "",
        body: doc.scripts_body || ""
      };
    } else {
      console.log("No global configuration document found");
    }
  } catch (error) {
    console.error("Error fetching global scripts:", error);
  }
  return { header: "", body: "" };
}

export default async function RootLayout({ children }) {
  const { header: scriptsHeader, body: scriptsBody } = await getGlobalScripts();

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

  const hasHeaderScripts = scriptsHeader && scriptsHeader.trim().length > 0;
  const hasBodyScripts = scriptsBody && scriptsBody.trim().length > 0;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Blocking script to prevent FOUC - applies theme before content renders */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var resolvedTheme = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : (systemDark ? 'dark' : 'light');
                  document.documentElement.classList.add(resolvedTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
        {hasHeaderScripts ? parse(scriptsHeader) : null}
      </head>
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
        {hasBodyScripts ? parse(scriptsBody) : null}
      </body>
    </html>
  );
}
