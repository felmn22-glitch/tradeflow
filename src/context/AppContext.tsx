"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { AppState, Trade, CapitalTransaction, MesaPayout } from "@/lib/types"
import { loadState, saveState, generateId } from "@/lib/storage"
import { calcTradeResult } from "@/lib/calculations"

interface AppContextValue {
  state: AppState
  addTrade: (trade: Omit<Trade, "id" | "result" | "createdAt">) => void
  updateTrade: (id: string, trade: Partial<Trade>) => void
  deleteTrade: (id: string) => void
  importTrades: (trades: Trade[]) => void
  addTransaction: (tx: Omit<CapitalTransaction, "id">) => void
  deleteTransaction: (id: string) => void
  addMesaPayout: (p: Omit<MesaPayout, "id">) => void
  deleteMesaPayout: (id: string) => void
  setInitialCapital: (amount: number) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    trades: [],
    capitalTransactions: [],
    mesaPayouts: [],
    initialCapital: 0,
  }))
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveState(state)
  }, [state, hydrated])

  function addTrade(tradeData: Omit<Trade, "id" | "result" | "createdAt">) {
    const result = calcTradeResult(
      tradeData.direction,
      tradeData.quantity,
      tradeData.entryPrice,
      tradeData.exitPrice,
      tradeData.fees
    )
    const trade: Trade = {
      ...tradeData,
      id: generateId(),
      result,
      createdAt: new Date().toISOString(),
    }
    setState((s) => ({ ...s, trades: [trade, ...s.trades] }))
  }

  function updateTrade(id: string, updates: Partial<Trade>) {
    setState((s) => ({
      ...s,
      trades: s.trades.map((t) => {
        if (t.id !== id) return t
        const updated = { ...t, ...updates }
        updated.result = calcTradeResult(
          updated.direction,
          updated.quantity,
          updated.entryPrice,
          updated.exitPrice,
          updated.fees
        )
        return updated
      }),
    }))
  }

  function deleteTrade(id: string) {
    setState((s) => ({ ...s, trades: s.trades.filter((t) => t.id !== id) }))
  }

  function importTrades(trades: Trade[]) {
    setState((s) => ({ ...s, trades: [...trades, ...s.trades] }))
  }

  function addTransaction(txData: Omit<CapitalTransaction, "id">) {
    const tx: CapitalTransaction = { ...txData, id: generateId() }
    setState((s) => ({
      ...s,
      capitalTransactions: [tx, ...s.capitalTransactions],
    }))
  }

  function deleteTransaction(id: string) {
    setState((s) => ({
      ...s,
      capitalTransactions: s.capitalTransactions.filter((t) => t.id !== id),
    }))
  }

  function addMesaPayout(data: Omit<MesaPayout, "id">) {
    const payout: MesaPayout = { ...data, id: generateId() }
    setState((s) => ({ ...s, mesaPayouts: [payout, ...s.mesaPayouts] }))
  }

  function deleteMesaPayout(id: string) {
    setState((s) => ({
      ...s,
      mesaPayouts: s.mesaPayouts.filter((p) => p.id !== id),
    }))
  }

  function setInitialCapital(amount: number) {
    setState((s) => ({ ...s, initialCapital: amount }))
  }

  return (
    <AppContext.Provider
      value={{
        state,
        addTrade,
        updateTrade,
        deleteTrade,
        importTrades,
        addTransaction,
        deleteTransaction,
        addMesaPayout,
        deleteMesaPayout,
        setInitialCapital,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
