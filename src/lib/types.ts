export type TradeType = "day_trade" | "swing_trade" | "forex"
export type TradeDirection = "compra" | "venda"
export type AssetType = "acao" | "fii" | "etf" | "opcao" | "futuro" | "cripto" | "forex"

export interface Trade {
  id: string
  date: string
  asset: string
  assetType: AssetType
  type: TradeType
  direction: TradeDirection
  quantity: number
  entryPrice: number
  exitPrice: number
  fees: number
  result: number
  notes: string
  createdAt: string
}

export interface CapitalTransaction {
  id: string
  date: string
  type: "deposito" | "retirada"
  amount: number
  description: string
}

export interface MonthlyTaxRecord {
  year: number
  month: number
  dayTradeProfits: number
  dayTradeLosses: number
  swingTradeProfits: number
  swingTradeLosses: number
  dayTradeLossCarryover: number
  swingTradeLossCarryover: number
  dayTradeTaxBase: number
  swingTradeTaxBase: number
  dayTaxDue: number
  swingTaxDue: number
  totalTaxDue: number
  paid: boolean
  paidAmount: number
}

export interface MesaPayout {
  id: string
  year: number
  month: number
  grossAmount: number
  taxWithheld: number
  description: string
}

export interface MonthlyForexRecord {
  year: number
  month: number
  profits: number
  losses: number
  lossCarryover: number
  taxBase: number
  taxDue: number
  effectiveRate: number
}

export interface MonthlyMesaRecord {
  year: number
  month: number
  grossAmount: number
  taxWithheld: number
  taxDue: number
  taxToPay: number
  effectiveRate: number
}

export interface AppState {
  trades: Trade[]
  capitalTransactions: CapitalTransaction[]
  mesaPayouts: MesaPayout[]
  initialCapital: number
}
