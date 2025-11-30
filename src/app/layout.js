import "./app.css";
import { Inter, Nunito_Sans } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunitoSans = Nunito_Sans({
  weight: ['300', '400', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-nunito"
});

export const metadata = {
  title: "Vecivendo",
  description: "Marketplace para comunidades",
  manifest: "/manifest.json",
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
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${nunitoSans.variable} font-sans bg-background text-text-secondary antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
