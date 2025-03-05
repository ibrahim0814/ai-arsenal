import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./components/theme-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "AI Arsenal",
  description: "A collection of AI tools I use",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><text y='32' font-size='32'>⚔️</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to API endpoints to speed up data loading */}
        <link rel="preconnect" href="/api" />
        
        {/* Preload critical CSS */}
        <link 
          rel="preload" 
          href="/globals.css" 
          as="style" 
        />
        
        {/* Preload critical JavaScript */}
        <link 
          rel="modulepreload" 
          href="/_next/static/chunks/pages/app.js" 
        />

        {/* Initialize auth cache check early */}
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              // Early auth check to avoid waiting for component mount
              try {
                const cachedUser = sessionStorage.getItem('arsenal_auth_cache');
                const cachedAdmin = sessionStorage.getItem('arsenal_admin_status');
                const expiry = sessionStorage.getItem('arsenal_auth_expiry');
                
                if (cachedUser && expiry && Date.now() < parseInt(expiry)) {
                  window.__ARSENAL_CACHED_AUTH = {
                    user: JSON.parse(cachedUser),
                    isAdmin: cachedAdmin ? JSON.parse(cachedAdmin) : false
                  };
                }
              } catch (e) {
                console.warn('Failed to check auth cache during initial load', e);
              }
            `
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-950`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          {/* Defer non-critical analytics */}
          <script 
            dangerouslySetInnerHTML={{
              __html: `
                setTimeout(() => {
                  const analyticsScript = document.createElement('script');
                  analyticsScript.src = '/_vercel/insights/script.js';
                  analyticsScript.defer = true;
                  document.body.appendChild(analyticsScript);
                }, 1000);
              `
            }} 
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
