import "../app.css";
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
    title: "Vecivendo | Admin Console",
    description: "Panel de administración",
};

export default function AdminLayout({ children }) {
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
            </head>
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
