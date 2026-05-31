"use client"

import { useState } from "react"
import { useApp } from "@/context/AppContext"
import { calcStats, formatBRL } from "@/lib/calculations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react"

export default function CapitalPage() {
  const { state, addTransaction, deleteTransaction, setInitialCapital } = useApp()
  const { trades, capitalTransactions, initialCapital } = state
  const [open, setOpen] = useState(false)
  const [editingCapital, setEditingCapital] = useState(false)
  const [capitalInput, setCapitalInput] = useState("")
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "deposito" as "deposito" | "retirada",
    amount: "",
    description: "",
  })

  const stats = calcStats(trades)
  const deposits = capitalTransactions.filter((t) => t.type === "deposito").reduce((s, t) => s + t.amount, 0)
  const withdrawals = capitalTransactions.filter((t) => t.type === "retirada").reduce((s, t) => s + t.amount, 0)
  const currentCapital = initialCapital + deposits - withdrawals + stats.totalPnL
  const totalInvested = initialCapital + deposits - withdrawals
  const returnPct = totalInvested > 0 ? (stats.totalPnL / totalInvested) * 100 : 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addTransaction({
      date: form.date,
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
    })
    setForm({ date: new Date().toISOString().split("T")[0], type: "deposito", amount: "", description: "" })
    setOpen(false)
  }

  function handleSaveCapital() {
    const val = parseFloat(capitalInput)
    if (!isNaN(val) && val >= 0) {
      setInitialCapital(val)
    }
    setEditingCapital(false)
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Controle de Capital</h1>
          <p className="text-gray-400 text-xs lg:text-sm">Gerencie depósitos, retiradas e acompanhe seu patrimônio</p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Movimentação</span>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white mx-4">
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
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
                <Label className="text-gray-300 text-xs">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "deposito" | "retirada" })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="deposito">Depósito</SelectItem>
                    <SelectItem value="retirada">Retirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Descrição</Label>
              <Input
                placeholder="Aporte mensal, retirada para despesas..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white mt-1"
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-xs">Capital Atual</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-emerald-400">{formatBRL(currentCapital)}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}% retorno
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-xs">Capital Inicial</span>
              <button
                onClick={() => { setCapitalInput(initialCapital.toString()); setEditingCapital(true) }}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                editar
              </button>
            </div>
            {editingCapital ? (
              <div className="flex gap-1 mt-1">
                <Input
                  type="number"
                  value={capitalInput}
                  onChange={(e) => setCapitalInput(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveCapital} className="h-8 bg-emerald-600">OK</Button>
              </div>
            ) : (
              <p className="text-lg font-bold text-white">{formatBRL(initialCapital)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-xs">Depositado</span>
              <ArrowUpRight className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-lg font-bold text-blue-400">{formatBRL(deposits)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-xs">Retirado</span>
              <ArrowDownLeft className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-lg font-bold text-orange-400">{formatBRL(withdrawals)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm text-gray-300">Resumo de Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="P&L de Trades" value={formatBRL(stats.totalPnL)} positive={stats.totalPnL >= 0} />
            <Row label="Capital Investido" value={formatBRL(totalInvested)} />
            <Row label="Retorno %" value={`${returnPct.toFixed(2)}%`} positive={returnPct >= 0} />
            <Row label="Avg. Ganho" value={formatBRL(stats.avgWin)} positive />
            <Row label="Avg. Perda" value={formatBRL(stats.avgLoss)} positive={false} />
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm text-gray-300">Histórico de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            {capitalTransactions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Nenhuma movimentação registrada.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {capitalTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                    <div className="flex items-center gap-2">
                      {tx.type === "deposito" ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      )}
                      <div>
                        <p className="text-white text-sm">{tx.description || (tx.type === "deposito" ? "Depósito" : "Retirada")}</p>
                        <p className="text-gray-500 text-xs">{tx.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-semibold text-sm ${tx.type === "deposito" ? "text-emerald-400" : "text-orange-400"}`}>
                        {tx.type === "deposito" ? "+" : "-"}{formatBRL(tx.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-gray-500 hover:text-red-400 h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const color =
    positive === undefined ? "text-white" : positive ? "text-emerald-400" : "text-red-400"
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-700/30 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`font-mono font-semibold text-sm ${color}`}>{value}</span>
    </div>
  )
}
