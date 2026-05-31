"use client"

import { useState } from "react"
import { useApp } from "@/context/AppContext"
import {
  calcMonthlyTax,
  calcMonthlyForex,
  calcMonthlyMesa,
  formatBRL,
} from "@/lib/calculations"
import { MonthlyTaxRecord, MonthlyForexRecord, MonthlyMesaRecord, MesaPayout } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Download, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export default function IRPage() {
  const { state, addMesaPayout, deleteMesaPayout } = useApp()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const rvRecords = buildRVRecords(state.trades, selectedYear)
  const fxRecords = buildForexRecords(state.trades, selectedYear)
  const mesaRecords = buildMesaRecords(state.mesaPayouts ?? [], selectedYear)

  const totalRVTax = rvRecords.reduce((s, r) => s + r.totalTaxDue, 0)
  const totalFxTax = fxRecords.reduce((s, r) => s + r.taxDue, 0)
  const totalMesaTax = mesaRecords.reduce((s, r) => s + r.taxToPay, 0)
  const totalAllTax = totalRVTax + totalFxTax + totalMesaTax

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Calculadora de IR</h1>
        <p className="text-gray-400 text-sm">
          Renda Variável · Forex (Ganho de Capital) · Mesa Proprietária (Carnê-Leão)
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-gray-300 text-sm">Ano:</Label>
        <div className="flex gap-1">
          {[currentYear - 1, currentYear].map((y) => (
            <Button
              key={y}
              variant={selectedYear === y ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedYear(y)}
              className={selectedYear === y ? "bg-emerald-600" : "border-gray-600 text-gray-300"}
            >
              {y}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="IR Total no Ano" value={formatBRL(totalAllTax)} color="red" />
        <SummaryCard label="IR Renda Variável" value={formatBRL(totalRVTax)} color="amber" />
        <SummaryCard label="IR Forex" value={formatBRL(totalFxTax)} color="amber" />
        <SummaryCard label="IR Mesa (a pagar)" value={formatBRL(totalMesaTax)} color="amber" />
      </div>

      <Tabs defaultValue="rv">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="rv" className="data-[state=active]:bg-emerald-600 text-gray-300">
            Renda Variável
          </TabsTrigger>
          <TabsTrigger value="forex" className="data-[state=active]:bg-blue-600 text-gray-300">
            Forex (OTC/Spot)
          </TabsTrigger>
          <TabsTrigger value="mesa" className="data-[state=active]:bg-purple-600 text-gray-300">
            Mesa Proprietária
          </TabsTrigger>
        </TabsList>

        {/* ─── ABA: RENDA VARIÁVEL ─── */}
        <TabsContent value="rv" className="space-y-3 mt-4">
          <InfoBox color="blue">
            <b>Renda Variável (ações, futuros, FIIs, ETFs, cripto, opções):</b> Day Trade 20% s/ lucro líquido mensal •
            Swing Trade 15% s/ lucro acima de R$ 20.000/mês • Perdas compensam lucros futuros na mesma modalidade •
            DARF código 6015 • Vence último dia útil do mês seguinte.
          </InfoBox>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-300">Apuração Mensal — {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rvRecords.map((r) => (
                <RVRow key={r.month} record={r} onExport={() => exportDARF_RV(r)} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ABA: FOREX ─── */}
        <TabsContent value="forex" className="space-y-3 mt-4">
          <InfoBox color="blue">
            <b>Forex OTC/Spot (câmbio fora de bolsa):</b> Tributado como Ganho de Capital com alíquotas
            progressivas — 15% (até R$ 5M) · 17,5% (R$ 5M–10M) · 20% (R$ 10M–30M) · 22,5% (acima de R$ 30M) •
            Perdas compensam ganhos futuros • DARF código 4600 • Vence último dia útil do mês seguinte.
            <br />
            <span className="text-yellow-300 text-xs">
              ⚠ Contratos futuros de câmbio negociados na B3 seguem as regras de Renda Variável (aba anterior).
            </span>
          </InfoBox>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-300">Apuração Mensal Forex — {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {fxRecords.map((r) => (
                <ForexRow key={r.month} record={r} onExport={() => exportDARF_Forex(r)} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ABA: MESA PROPRIETÁRIA ─── */}
        <TabsContent value="mesa" className="space-y-3 mt-4">
          <InfoBox color="purple">
            <b>Mesa Proprietária (Capital Alheio):</b> O repasse de lucros do desk ao trader é tributado como
            rendimento de pessoa física pela <b>Tabela Progressiva Mensal (Carnê-Leão)</b> — DARF código 0190 •
            Caso a empresa já retenha IR na fonte, informe o valor retido para calcular apenas o saldo a pagar •
            Alíquotas: isento até R$ 2.824 · 7,5% · 15% · 22,5% · 27,5% (tabela 2024).
            <br />
            <span className="text-yellow-300 text-xs">
              ⚠ Se você opera com capital <b>próprio</b> alocado via mesa (sem repasse de lucros), use a aba Renda Variável.
            </span>
          </InfoBox>
          <MesaSection
            year={selectedYear}
            payouts={state.mesaPayouts ?? []}
            records={mesaRecords}
            onAdd={addMesaPayout}
            onDelete={deleteMesaPayout}
          />
        </TabsContent>
      </Tabs>

      <InfoBox color="gray">
        <b>Aviso Legal:</b> Esta calculadora é informativa e não substitui orientação de contador habilitado.
        As alíquotas do carnê-leão e os limites de isenção são atualizados anualmente pela Receita Federal.
      </InfoBox>
    </div>
  )
}

// ─── RV ROW ──────────────────────────────────────────────────────────────────
function RVRow({ record, onExport }: { record: MonthlyTaxRecord; onExport: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasActivity =
    record.dayTradeProfits > 0 || record.dayTradeLosses > 0 ||
    record.swingTradeProfits > 0 || record.swingTradeLosses > 0

  return (
    <div className="rounded-lg border border-gray-700/50 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-white font-medium w-24 text-sm shrink-0">{MONTHS[record.month - 1]}</span>
        <div className="flex-1 flex items-center gap-4 text-xs">
          <span className="text-gray-400">
            DT: <span className={record.dayTradeProfits - record.dayTradeLosses >= 0 ? "text-emerald-400" : "text-red-400"}>
              {formatBRL(record.dayTradeProfits - record.dayTradeLosses)}
            </span>
          </span>
          <span className="text-gray-400">
            SW: <span className={record.swingTradeProfits - record.swingTradeLosses >= 0 ? "text-emerald-400" : "text-red-400"}>
              {formatBRL(record.swingTradeProfits - record.swingTradeLosses)}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {record.totalTaxDue > 0 ? (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">IR: {formatBRL(record.totalTaxDue)}</Badge>
          ) : hasActivity ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Sem IR</Badge>
          ) : (
            <Badge variant="outline" className="text-gray-600 border-gray-700">Sem ops.</Badge>
          )}
          {record.totalTaxDue > 0 && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onExport() }}
              className="h-7 text-xs border-gray-600 text-gray-300">
              <Download className="w-3 h-3 mr-1" />DARF 6015
            </Button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
        </div>
      </div>
      {expanded && hasActivity && (
        <div className="px-4 pb-4 border-t border-gray-700/50 pt-3 bg-gray-900/30">
          <div className="grid grid-cols-2 gap-6">
            <TaxSection title="Day Trade — 20%" profits={record.dayTradeProfits} losses={record.dayTradeLosses}
              taxBase={record.dayTradeTaxBase} taxDue={record.dayTaxDue} carryover={record.dayTradeLossCarryover} />
            <TaxSection title="Swing Trade — 15%" profits={record.swingTradeProfits} losses={record.swingTradeLosses}
              taxBase={record.swingTradeTaxBase} taxDue={record.swingTaxDue} carryover={record.swingTradeLossCarryover}
              exemption={20000} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── FOREX ROW ───────────────────────────────────────────────────────────────
function ForexRow({ record, onExport }: { record: MonthlyForexRecord; onExport: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasActivity = record.profits > 0 || record.losses > 0

  return (
    <div className="rounded-lg border border-gray-700/50 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-white font-medium w-24 text-sm shrink-0">{MONTHS[record.month - 1]}</span>
        <div className="flex-1 flex items-center gap-4 text-xs">
          <span className="text-gray-400">
            Lucros: <span className="text-emerald-400">{formatBRL(record.profits)}</span>
          </span>
          <span className="text-gray-400">
            Perdas: <span className="text-red-400">{formatBRL(record.losses)}</span>
          </span>
          <span className="text-gray-400">
            Líquido: <span className={record.profits - record.losses >= 0 ? "text-emerald-400" : "text-red-400"}>
              {formatBRL(record.profits - record.losses)}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {record.taxDue > 0 ? (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              IR: {formatBRL(record.taxDue)} ({(record.effectiveRate * 100).toFixed(1)}%)
            </Badge>
          ) : hasActivity ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Sem IR</Badge>
          ) : (
            <Badge variant="outline" className="text-gray-600 border-gray-700">Sem ops.</Badge>
          )}
          {record.taxDue > 0 && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onExport() }}
              className="h-7 text-xs border-gray-600 text-gray-300">
              <Download className="w-3 h-3 mr-1" />DARF 4600
            </Button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
        </div>
      </div>
      {expanded && hasActivity && (
        <div className="px-4 pb-4 border-t border-gray-700/50 pt-3 bg-gray-900/30">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <DetailLine label="Lucros brutos" value={formatBRL(record.profits)} positive />
              <DetailLine label="Perdas" value={formatBRL(record.losses)} />
              <DetailLine label="Perda acumulada anterior" value={formatBRL(record.lossCarryover > 0 ? record.lossCarryover : 0)} />
              <DetailLine label="Base de cálculo" value={formatBRL(record.taxBase)} />
            </div>
            <div className="space-y-1.5">
              <DetailLine label="Alíquota efetiva" value={`${(record.effectiveRate * 100).toFixed(2)}%`} />
              <DetailLine label="IR devido" value={formatBRL(record.taxDue)} highlight />
              {record.lossCarryover > 0 && (
                <DetailLine label="Perda p/ mês seguinte" value={formatBRL(record.lossCarryover)} />
              )}
              <div className="mt-2 p-2 bg-blue-900/20 rounded text-blue-300 text-xs">
                Alíquotas: 15% ≤R$5M · 17,5% ≤R$10M · 20% ≤R$30M · 22,5% &gt;R$30M
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MESA SECTION ────────────────────────────────────────────────────────────
function MesaSection({
  year, payouts, records, onAdd, onDelete,
}: {
  year: number
  payouts: MesaPayout[]
  records: MonthlyMesaRecord[]
  onAdd: (p: Omit<MesaPayout, "id">) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    month: String(new Date().getMonth() + 1),
    grossAmount: "",
    taxWithheld: "0",
    description: "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({
      year,
      month: parseInt(form.month),
      grossAmount: parseFloat(form.grossAmount),
      taxWithheld: parseFloat(form.taxWithheld) || 0,
      description: form.description,
    })
    setForm({ month: String(new Date().getMonth() + 1), grossAmount: "", taxWithheld: "0", description: "" })
    setOpen(false)
  }

  const totalGross = records.reduce((s, r) => s + r.grossAmount, 0)
  const totalToPay = records.reduce((s, r) => s + r.taxToPay, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm">
          <span className="text-gray-400">Repasse total: <span className="text-white font-mono">{formatBRL(totalGross)}</span></span>
          <span className="text-gray-400">IR a pagar: <span className="text-red-400 font-mono">{formatBRL(totalToPay)}</span></span>
        </div>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Lançar Repasse
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Repasse da Mesa — {year}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs">Mês</Label>
                <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v ?? form.month })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Valor Bruto Recebido (R$)</Label>
                <Input type="number" step="0.01" placeholder="5000.00" value={form.grossAmount}
                  onChange={(e) => setForm({ ...form, grossAmount: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white mt-1" required />
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">IR Retido na Fonte pela Mesa (R$)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.taxWithheld}
                onChange={(e) => setForm({ ...form, taxWithheld: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white mt-1" />
              <p className="text-gray-500 text-xs mt-1">Deixe 0 se a mesa não retém IR.</p>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Descrição</Label>
              <Input placeholder="Repasse quinzenal, bônus..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-600 text-gray-300">Cancelar</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm text-gray-300">Apuração Mensal Mesa — {year}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {records.map((r) => (
            <MesaRow
              key={r.month}
              record={r}
              payouts={payouts.filter((p) => p.year === year && p.month === r.month)}
              onDelete={onDelete}
              onExport={() => exportDARF_Mesa(r)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function MesaRow({
  record, payouts, onDelete, onExport,
}: {
  record: MonthlyMesaRecord
  payouts: MesaPayout[]
  onDelete: (id: string) => void
  onExport: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasActivity = record.grossAmount > 0

  return (
    <div className="rounded-lg border border-gray-700/50 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-white font-medium w-24 text-sm shrink-0">{MONTHS[record.month - 1]}</span>
        <div className="flex-1 flex items-center gap-4 text-xs">
          <span className="text-gray-400">
            Repasse: <span className="text-white">{formatBRL(record.grossAmount)}</span>
          </span>
          <span className="text-gray-400">
            IR calculado: <span className="text-amber-400">{formatBRL(record.taxDue)}</span>
          </span>
          {record.taxWithheld > 0 && (
            <span className="text-gray-400">
              Retido: <span className="text-gray-300">{formatBRL(record.taxWithheld)}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {record.taxToPay > 0 ? (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
              A pagar: {formatBRL(record.taxToPay)}
            </Badge>
          ) : hasActivity ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Quitado</Badge>
          ) : (
            <Badge variant="outline" className="text-gray-600 border-gray-700">Sem repasse</Badge>
          )}
          {record.taxToPay > 0 && (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onExport() }}
              className="h-7 text-xs border-gray-600 text-gray-300">
              <Download className="w-3 h-3 mr-1" />DARF 0190
            </Button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-700/50 pt-3 bg-gray-900/30 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <DetailLine label="Rendimento bruto" value={formatBRL(record.grossAmount)} positive />
              <DetailLine label="IR tabela progressiva" value={formatBRL(record.taxDue)} />
              <DetailLine label="IR retido na fonte" value={formatBRL(record.taxWithheld)} />
              <DetailLine label="Alíquota efetiva" value={`${(record.effectiveRate * 100).toFixed(2)}%`} />
              <DetailLine label="IR a recolher (DARF 0190)" value={formatBRL(record.taxToPay)} highlight />
            </div>
            <div className="space-y-1 p-2 bg-purple-900/20 rounded text-purple-300 text-xs">
              <p className="font-semibold">Tabela Carnê-Leão 2024:</p>
              <p>Isento: até R$ 2.824,00</p>
              <p>7,5%: R$ 2.824 – R$ 3.751</p>
              <p>15%: R$ 3.751 – R$ 4.664</p>
              <p>22,5%: R$ 4.664 – R$ 5.903</p>
              <p>27,5%: acima de R$ 5.903</p>
            </div>
          </div>
          {payouts.length > 0 && (
            <div className="space-y-1.5 border-t border-gray-700/50 pt-3">
              <p className="text-gray-400 text-xs font-medium">Lançamentos do mês:</p>
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">{p.description || "Repasse"}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">{formatBRL(p.grossAmount)}</span>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function TaxSection({ title, profits, losses, taxBase, taxDue, carryover, exemption }: {
  title: string; profits: number; losses: number; taxBase: number; taxDue: number; carryover: number; exemption?: number
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-gray-300 text-xs font-semibold">{title}</p>
      <DetailLine label="Lucros" value={formatBRL(profits)} positive />
      <DetailLine label="Perdas" value={formatBRL(losses)} />
      {exemption !== undefined && <DetailLine label="Isenção" value={formatBRL(exemption)} />}
      <DetailLine label="Base de cálculo" value={formatBRL(taxBase)} />
      {carryover > 0 && <DetailLine label="Perda → próx. mês" value={formatBRL(carryover)} />}
      <div className="pt-1 border-t border-gray-700/50">
        <DetailLine label="IR devido" value={formatBRL(taxDue)} highlight />
      </div>
    </div>
  )
}

function DetailLine({ label, value, positive, highlight }: {
  label: string; value: string; positive?: boolean; highlight?: boolean
}) {
  const color = highlight
    ? "text-red-400 font-bold"
    : positive ? "text-emerald-400" : "text-gray-200"
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400", red: "text-red-400", amber: "text-amber-400",
  }
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="pt-5">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className={`text-xl font-bold ${colors[color] ?? "text-white"}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function InfoBox({ children, color }: { children: React.ReactNode; color: "blue" | "purple" | "gray" }) {
  const styles = {
    blue: "bg-blue-900/20 border-blue-700/50 text-blue-300",
    purple: "bg-purple-900/20 border-purple-700/50 text-purple-300",
    gray: "bg-gray-800/80 border-gray-700 text-gray-400",
  }
  return (
    <div className={`rounded-lg border p-3 flex gap-2 text-sm ${styles[color]}`}>
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}

// ─── BUILDERS ────────────────────────────────────────────────────────────────
function buildRVRecords(trades: import("@/lib/types").Trade[], year: number): MonthlyTaxRecord[] {
  const records: MonthlyTaxRecord[] = []
  let dayCarry = 0, swingCarry = 0
  for (let m = 1; m <= 12; m++) {
    const r = calcMonthlyTax(trades.filter((t) => t.type !== "forex"), year, m, dayCarry, swingCarry)
    dayCarry = r.dayTradeLossCarryover
    swingCarry = r.swingTradeLossCarryover
    records.push(r)
  }
  return records
}

function buildForexRecords(trades: import("@/lib/types").Trade[], year: number): MonthlyForexRecord[] {
  const records: MonthlyForexRecord[] = []
  let carry = 0
  for (let m = 1; m <= 12; m++) {
    const r = calcMonthlyForex(trades, year, m, carry)
    carry = r.lossCarryover
    records.push(r)
  }
  return records
}

function buildMesaRecords(payouts: MesaPayout[], year: number): MonthlyMesaRecord[] {
  return Array.from({ length: 12 }, (_, i) => calcMonthlyMesa(payouts, year, i + 1))
}

// ─── DARF EXPORTERS ──────────────────────────────────────────────────────────
function exportDARF_RV(r: MonthlyTaxRecord) {
  const lines = [
    `DARF — Renda Variável  |  Código 6015`,
    `Período: ${MONTHS[r.month - 1]}/${r.year}`,
    ``,
    `Day Trade (20%): ${formatBRL(r.dayTaxDue)}`,
    `Swing Trade (15%): ${formatBRL(r.swingTaxDue)}`,
    `Total: ${formatBRL(r.totalTaxDue)}`,
    `Vencimento: último dia útil de ${MONTHS[r.month % 12]}`,
  ]
  downloadTxt(lines.join("\n"), `DARF_RV_${MONTHS[r.month - 1]}_${r.year}.txt`)
}

function exportDARF_Forex(r: MonthlyForexRecord) {
  const lines = [
    `DARF — Ganho de Capital Forex  |  Código 4600`,
    `Período: ${MONTHS[r.month - 1]}/${r.year}`,
    ``,
    `Lucros: ${formatBRL(r.profits)}`,
    `Perdas: ${formatBRL(r.losses)}`,
    `Base de cálculo: ${formatBRL(r.taxBase)}`,
    `Alíquota efetiva: ${(r.effectiveRate * 100).toFixed(2)}%`,
    `IR devido: ${formatBRL(r.taxDue)}`,
    `Vencimento: último dia útil de ${MONTHS[r.month % 12]}`,
  ]
  downloadTxt(lines.join("\n"), `DARF_Forex_${MONTHS[r.month - 1]}_${r.year}.txt`)
}

function exportDARF_Mesa(r: MonthlyMesaRecord) {
  const lines = [
    `DARF — Mesa Proprietária (Carnê-Leão)  |  Código 0190`,
    `Período: ${MONTHS[r.month - 1]}/${r.year}`,
    ``,
    `Rendimento bruto: ${formatBRL(r.grossAmount)}`,
    `IR tabela progressiva: ${formatBRL(r.taxDue)}`,
    `IR retido na fonte: ${formatBRL(r.taxWithheld)}`,
    `Alíquota efetiva: ${(r.effectiveRate * 100).toFixed(2)}%`,
    `IR a recolher: ${formatBRL(r.taxToPay)}`,
    `Vencimento: último dia útil de ${MONTHS[r.month % 12]}`,
  ]
  downloadTxt(lines.join("\n"), `DARF_Mesa_${MONTHS[r.month - 1]}_${r.year}.txt`)
}

function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
