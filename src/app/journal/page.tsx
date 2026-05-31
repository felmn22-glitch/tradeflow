"use client"

import { useState, useRef } from "react"
import { useApp } from "@/context/AppContext"
import { formatBRL } from "@/lib/calculations"
import { parseCSV, CSV_TEMPLATE } from "@/lib/csv-parser"
import { Trade, AssetType, TradeType, TradeDirection } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, Upload, Download, ChevronDown, ChevronUp } from "lucide-react"

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  asset: "",
  assetType: "acao" as AssetType,
  type: "day_trade" as TradeType,
  direction: "compra" as TradeDirection,
  quantity: "",
  entryPrice: "",
  exitPrice: "",
  fees: "0",
  notes: "",
}

export default function JournalPage() {
  const { state, addTrade, deleteTrade, importTrades } = useApp()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addTrade({
      date: form.date,
      asset: form.asset.toUpperCase(),
      assetType: form.assetType,
      type: form.type,
      direction: form.direction,
      quantity: parseFloat(form.quantity),
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: parseFloat(form.exitPrice),
      fees: parseFloat(form.fees) || 0,
      notes: form.notes,
    })
    setForm(emptyForm)
    setOpen(false)
  }

  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const trades = parseCSV(text)
      if (trades.length > 0) {
        importTrades(trades)
        alert(`${trades.length} operações importadas com sucesso!`)
      } else {
        alert("Nenhuma operação encontrada no CSV. Verifique o formato.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tradeflow_modelo.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = state.trades.filter(
    (t) =>
      !filter ||
      t.asset.toLowerCase().includes(filter.toLowerCase()) ||
      t.notes.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Diário de Trades</h1>
          <p className="text-gray-400 text-xs lg:text-sm">{state.trades.length} operações registradas</p>
        </div>
        <div className="flex gap-1.5 lg:gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-gray-600 text-gray-300 hidden sm:flex">
            <Download className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Modelo CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="border-gray-600 text-gray-300">
            <Upload className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Importar CSV</span>
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Nova Operação</span>
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle>Registrar Operação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs">Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Ativo</Label>
                <Input
                  placeholder="PETR4"
                  value={form.asset}
                  onChange={(e) => setForm({ ...form, asset: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-gray-300 text-xs">Tipo Ativo</Label>
                <Select value={form.assetType} onValueChange={(v) => setForm({ ...form, assetType: v as AssetType, type: v === "forex" ? "forex" : form.type })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="acao">Ação</SelectItem>
                    <SelectItem value="fii">FII</SelectItem>
                    <SelectItem value="etf">ETF</SelectItem>
                    <SelectItem value="opcao">Opção</SelectItem>
                    <SelectItem value="futuro">Futuro</SelectItem>
                    <SelectItem value="cripto">Cripto</SelectItem>
                    <SelectItem value="forex">Forex (OTC/Spot)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Modalidade</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TradeType })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="day_trade">Day Trade</SelectItem>
                    <SelectItem value="swing_trade">Swing Trade</SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Direção</Label>
                <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v as TradeDirection })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="compra">Compra</SelectItem>
                    <SelectItem value="venda">Venda (Short)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs">Quantidade</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Taxas (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.fees}
                  onChange={(e) => setForm({ ...form, fees: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs">Preço Entrada</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="28.50"
                  value={form.entryPrice}
                  onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Preço Saída</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="29.10"
                  value={form.exitPrice}
                  onChange={(e) => setForm({ ...form, exitPrice: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs">Notas / Setup</Label>
              <Textarea
                placeholder="Descreva o setup, entrada, motivo da saída..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white mt-1 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-600 text-gray-300">
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Input
        placeholder="Filtrar por ativo ou notas..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="bg-gray-800 border-gray-700 text-white"
      />

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">Nenhuma operação encontrada.</p>
              <p className="text-gray-500 text-sm mt-1">Clique em "+" ou importe um CSV.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              expanded={expandedId === trade.id}
              onToggle={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
              onDelete={() => deleteTrade(trade.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TradeRow({
  trade,
  expanded,
  onToggle,
  onDelete,
}: {
  trade: Trade
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-0">
        <div
          className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-700/30 transition-colors"
          onClick={onToggle}
        >
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="font-mono font-bold text-white text-sm w-14 shrink-0">{trade.asset}</span>
            <Badge
              variant="outline"
              className={`text-xs shrink-0 ${trade.type === "day_trade" ? "border-blue-500/50 text-blue-400" : trade.type === "forex" ? "border-yellow-500/50 text-yellow-400" : "border-purple-500/50 text-purple-400"}`}
            >
              {trade.type === "day_trade" ? "DT" : trade.type === "forex" ? "FX" : "SW"}
            </Badge>
            <span className="text-gray-500 text-xs shrink-0 hidden sm:block">{trade.date}</span>
            {trade.notes && (
              <span className="text-gray-500 text-xs truncate hidden md:block">{trade.notes}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`font-mono font-bold text-sm ${trade.result >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatBRL(trade.result)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="text-gray-500 hover:text-red-400 h-7 w-7 p-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>
        </div>

        {expanded && (
          <div className="px-3 pb-3 border-t border-gray-700/50 pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Detail label="Data" value={trade.date} />
              <Detail label="Qtd." value={trade.quantity.toString()} />
              <Detail label="Entrada" value={formatBRL(trade.entryPrice)} />
              <Detail label="Saída" value={formatBRL(trade.exitPrice)} />
              <Detail label="Taxas" value={formatBRL(trade.fees)} />
              <Detail label="Direção" value={trade.direction} />
            </div>
            {trade.notes && (
              <div className="mt-3">
                <p className="text-gray-400 text-xs mb-1">Notas</p>
                <p className="text-gray-200 text-sm bg-gray-700/50 rounded p-2">{trade.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white font-mono text-sm">{value}</p>
    </div>
  )
}
