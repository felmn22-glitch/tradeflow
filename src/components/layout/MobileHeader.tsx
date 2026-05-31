"use client"

import { usePathname } from "next/navigation"
import { TrendingUp } from "lucide-react"

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/journal": "Diário de Trades",
  "/capital": "Controle de Capital",
  "/ir": "Calculadora de IR",
}

export function MobileHeader() {
  const pathname = usePathname()
  const title = titles[pathname] ?? "TradeFlow"

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-2">
      <TrendingUp className="w-5 h-5 text-emerald-400" />
      <span className="font-semibold text-white">{title}</span>
    </header>
  )
}
