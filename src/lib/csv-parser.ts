import { Trade, AssetType, TradeType, TradeDirection } from "./types"
import { generateId } from "./storage"
import { calcTradeResult } from "./calculations"

export interface ParsedCSVTrade {
  date: string
  asset: string
  assetType: AssetType
  type: TradeType
  direction: TradeDirection
  quantity: number
  entryPrice: number
  exitPrice: number
  fees: number
}

export function parseCSV(content: string): Trade[] {
  const lines = content.trim().split("\n")
  if (lines.length < 2) return []

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim())
  const trades: Trade[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim())
    if (cols.length < 8) continue

    const get = (field: string) => {
      const idx = header.indexOf(field)
      return idx >= 0 ? cols[idx] : ""
    }

    const quantity = parseFloat(get("quantidade") || get("qty") || "0")
    const entryPrice = parseFloat(get("preco_entrada") || get("entry") || "0")
    const exitPrice = parseFloat(get("preco_saida") || get("exit") || "0")
    const fees = parseFloat(get("taxas") || get("fees") || "0")
    const direction = (get("direcao") || get("direction") || "compra") as TradeDirection

    const result = calcTradeResult(direction, quantity, entryPrice, exitPrice, fees)

    trades.push({
      id: generateId(),
      date: get("data") || get("date") || new Date().toISOString().split("T")[0],
      asset: get("ativo") || get("asset") || "",
      assetType: (get("tipo_ativo") || "acao") as AssetType,
      type: (get("tipo") || "day_trade") as TradeType,
      direction,
      quantity,
      entryPrice,
      exitPrice,
      fees,
      result,
      notes: get("notas") || get("notes") || "",
      createdAt: new Date().toISOString(),
    })
  }

  return trades
}

export const CSV_TEMPLATE = `data,ativo,tipo_ativo,tipo,direcao,quantidade,preco_entrada,preco_saida,taxas,notas
2026-01-15,PETR4,acao,day_trade,compra,100,28.50,29.10,8.50,Rompimento de resistência
2026-01-16,VALE3,acao,swing_trade,compra,200,65.00,68.50,12.00,Suporte no diário`
