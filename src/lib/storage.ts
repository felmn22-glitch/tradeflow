import { AppState, Trade, CapitalTransaction } from "./types"

const STORAGE_KEY = "tradeflow_data"

const defaultState: AppState = {
  trades: [],
  capitalTransactions: [],
  mesaPayouts: [],
  initialCapital: 0,
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    return JSON.parse(raw) as AppState
  } catch {
    return defaultState
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
