"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, Wallet, Calculator } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Diário", icon: BookOpen },
  { href: "/capital", label: "Capital", icon: Wallet },
  { href: "/ir", label: "IR", icon: Calculator },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-gray-800 lg:hidden">
      <div className="flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
                active ? "text-emerald-400" : "text-gray-500"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]")} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <span className="absolute bottom-0 h-0.5 w-10 bg-emerald-400 rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
      {/* safe area para iPhones com home indicator */}
      <div className="h-safe-area-inset-bottom bg-gray-950" style={{ height: "env(safe-area-inset-bottom)" }} />
    </nav>
  )
}
