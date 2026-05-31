import { Trade, MonthlyTaxRecord, MesaPayout, MonthlyForexRecord, MonthlyMesaRecord } from "./types"

export function calcTradeResult(
  direction: "compra" | "venda",
  quantity: number,
  entryPrice: number,
  exitPrice: number,
  fees: number
): number {
  const gross =
    direction === "compra"
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity
  return gross - fees
}

export function calcMonthlyTax(
  trades: Trade[],
  year: number,
  month: number,
  prevDayCarryover: number,
  prevSwingCarryover: number
): MonthlyTaxRecord {
  const monthTrades = trades.filter((t) => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })

  let dayTradeProfits = 0
  let dayTradeLosses = 0
  let swingTradeProfits = 0
  let swingTradeLosses = 0

  for (const t of monthTrades) {
    if (t.type === "day_trade") {
      if (t.result > 0) dayTradeProfits += t.result
      else dayTradeLosses += Math.abs(t.result)
    } else {
      if (t.result > 0) swingTradeProfits += t.result
      else swingTradeLosses += Math.abs(t.result)
    }
  }

  // Day trade: 20% sobre lucro líquido (sem isenção)
  const dayNetBeforeCarry = dayTradeProfits - dayTradeLosses
  const dayNetAfterCarry = dayNetBeforeCarry - prevDayCarryover
  const dayTradeTaxBase = Math.max(0, dayNetAfterCarry)
  const dayTaxDue = dayTradeTaxBase * 0.2
  const dayTradeLossCarryover =
    dayNetAfterCarry < 0 ? Math.abs(dayNetAfterCarry) : 0

  // Swing trade: 15% sobre lucro acima de R$20.000/mês
  const swingNetBeforeCarry = swingTradeProfits - swingTradeLosses
  const swingNetAfterCarry = swingNetBeforeCarry - prevSwingCarryover
  const swingTradeTaxBase = Math.max(0, swingNetAfterCarry - 20000)
  const swingTaxDue = swingTradeTaxBase * 0.15
  const swingTradeLossCarryover =
    swingNetAfterCarry < 0 ? Math.abs(swingNetAfterCarry) : 0

  return {
    year,
    month,
    dayTradeProfits,
    dayTradeLosses,
    swingTradeProfits,
    swingTradeLosses,
    dayTradeLossCarryover,
    swingTradeLossCarryover,
    dayTradeTaxBase,
    swingTradeTaxBase,
    dayTaxDue,
    swingTaxDue,
    totalTaxDue: dayTaxDue + swingTaxDue,
    paid: false,
    paidAmount: 0,
  }
}

// ─── FOREX ──────────────────────────────────────────────────────────────────
// Ganho de capital em moeda estrangeira (spot/OTC forex).
// Alíquotas progressivas sobre o ganho líquido acumulado (art. 21 Lei 8.981/95
// com redação dada pela Lei 13.259/16).
// DARF código 4600. Vencimento: último dia útil do mês seguinte.
const FOREX_BANDS = [
  { limit: 5_000_000, rate: 0.15 },
  { limit: 10_000_000, rate: 0.175 },
  { limit: 30_000_000, rate: 0.20 },
  { limit: Infinity, rate: 0.225 },
]

export function calcForexTaxOnAmount(netGain: number): number {
  if (netGain <= 0) return 0
  let tax = 0
  let prev = 0
  for (const band of FOREX_BANDS) {
    const slice = Math.min(netGain, band.limit) - prev
    if (slice <= 0) break
    tax += slice * band.rate
    prev = band.limit
    if (netGain <= band.limit) break
  }
  return tax
}

export function effectiveForexRate(netGain: number): number {
  if (netGain <= 0) return 0
  return calcForexTaxOnAmount(netGain) / netGain
}

export function calcMonthlyForex(
  trades: Trade[],
  year: number,
  month: number,
  prevCarryover: number
): MonthlyForexRecord {
  const monthTrades = trades.filter((t) => {
    const d = new Date(t.date)
    return (
      t.type === "forex" &&
      d.getFullYear() === year &&
      d.getMonth() + 1 === month
    )
  })

  let profits = 0
  let losses = 0
  for (const t of monthTrades) {
    if (t.result > 0) profits += t.result
    else losses += Math.abs(t.result)
  }

  const netBeforeCarry = profits - losses
  const netAfterCarry = netBeforeCarry - prevCarryover
  const taxBase = Math.max(0, netAfterCarry)
  const taxDue = calcForexTaxOnAmount(taxBase)
  const lossCarryover = netAfterCarry < 0 ? Math.abs(netAfterCarry) : 0

  return {
    year,
    month,
    profits,
    losses,
    lossCarryover,
    taxBase,
    taxDue,
    effectiveRate: effectiveForexRate(taxBase),
  }
}

// ─── MESA PROPRIETÁRIA ───────────────────────────────────────────────────────
// Repasse de lucros do desk ao trader: tributado como rendimento de PF
// pela tabela progressiva mensal (carnê-leão, DARF 0190).
// Tabela 2024/2025 — ajuste anual via Receita Federal.
// O trader deve subtrair IR já retido na fonte pela mesa (se houver).
const CARNE_LEAO_BANDS = [
  { limit: 2_824.0, rate: 0, deduction: 0 },
  { limit: 3_751.05, rate: 0.075, deduction: 211.80 },
  { limit: 4_664.68, rate: 0.15, deduction: 494.37 },
  { limit: 5_903.12, rate: 0.225, deduction: 844.20 },
  { limit: Infinity, rate: 0.275, deduction: 1_139.38 },
]

export function calcCarneLeao(grossMonthly: number): number {
  if (grossMonthly <= CARNE_LEAO_BANDS[0].limit) return 0
  const band = CARNE_LEAO_BANDS.find((b) => grossMonthly <= b.limit)!
  return Math.max(0, grossMonthly * band.rate - band.deduction)
}

export function effectiveMesaRate(gross: number): number {
  if (gross <= 0) return 0
  return calcCarneLeao(gross) / gross
}

export function calcMonthlyMesa(
  payouts: MesaPayout[],
  year: number,
  month: number
): MonthlyMesaRecord {
  const monthPayouts = payouts.filter(
    (p) => p.year === year && p.month === month
  )
  const grossAmount = monthPayouts.reduce((s, p) => s + p.grossAmount, 0)
  const taxWithheld = monthPayouts.reduce((s, p) => s + p.taxWithheld, 0)
  const taxDue = calcCarneLeao(grossAmount)
  const taxToPay = Math.max(0, taxDue - taxWithheld)

  return {
    year,
    month,
    grossAmount,
    taxWithheld,
    taxDue,
    taxToPay,
    effectiveRate: effectiveMesaRate(grossAmount),
  }
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function calcEquityCurve(
  initialCapital: number,
  trades: Trade[]
): { date: string; equity: number }[] {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const points: { date: string; equity: number }[] = [
    { date: "Início", equity: initialCapital },
  ]
  let equity = initialCapital
  for (const t of sorted) {
    equity += t.result
    points.push({ date: t.date, equity })
  }
  return points
}

export function calcStats(trades: Trade[]) {
  if (trades.length === 0)
    return {
      totalPnL: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      totalTrades: 0,
    }

  const wins = trades.filter((t) => t.result > 0)
  const losses = trades.filter((t) => t.result < 0)
  const totalPnL = trades.reduce((s, t) => s + t.result, 0)
  const totalWins = wins.reduce((s, t) => s + t.result, 0)
  const totalLosses = Math.abs(losses.reduce((s, t) => s + t.result, 0))

  return {
    totalPnL,
    winRate: wins.length / trades.length,
    avgWin: wins.length ? totalWins / wins.length : 0,
    avgLoss: losses.length ? totalLosses / losses.length : 0,
    profitFactor: totalLosses ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
    totalTrades: trades.length,
  }
}
