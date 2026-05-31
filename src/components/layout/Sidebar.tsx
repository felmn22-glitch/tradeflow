"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, Wallet, Calculator, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Diário de Trades", icon: BookOpen },
  { href: "/capital", label: "Controle de Capital", icon: Wallet },
  { href: "/ir", label: "Calculadora de IR", icon: Calculator },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-60 min-h-screen bg-gray-950 border-r border-gray-800 flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          <span className="text-white font-bold text-lg">TradeFlow</span>
        </div>
        <p className="text-gray-500 text-xs mt-1">Controle seu trading</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-emerald-500/15 text-emerald-400 font-medium"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-600 text-xs text-center">
          Dados salvos localmente
        </p>
      </div>
    </aside>
  )
}
