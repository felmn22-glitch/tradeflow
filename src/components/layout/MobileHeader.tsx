"use client"

import Image from "next/image"

export function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-2 flex items-center">
      <Image
        src="/logo.png"
        alt="TradeFlow"
        width={140}
        height={46}
        className="h-10 w-auto object-contain"
        priority
      />
    </header>
  )
}
