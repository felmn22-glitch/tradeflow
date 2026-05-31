import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppProvider } from "@/context/AppContext"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { MobileHeader } from "@/components/layout/MobileHeader"
import { PWARegister } from "@/components/PWARegister"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TradeFlow",
  description: "Diário de trades, controle de capital e calculadora de IR",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TradeFlow",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="theme-color" content="#10B981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <AppProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <MobileHeader />
              <main className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</main>
            </div>
          </div>
          <BottomNav />
          <PWARegister />
        </AppProvider>
      </body>
    </html>
  )
}
