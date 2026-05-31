"use client"

import { useApp } from "@/context/AppContext"
import { calcStats, calcEquityCurve, formatBRL } from "@/lib/calculations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function DashboardPage() {
  const { state } = useApp()
  const { trades, capitalTransactions, initialCapital } = state

  const stats = calcStats(trades)
  const equityCurve = calcEquityCurve(initialCapital, trades)

  const deposits = capitalTransactions
    .filter((t) => t.type === "deposito")
    .reduce((s, t) => s + t.amount, 0)
  const withdrawals = capitalTransactions
    .filter((t) => t.type === "retirada")
    .reduce((s, t) => s + t.amount, 0)
  const currentCapital = initialCapital + deposits - withdrawals + stats.totalPnL

  const last30 = trades
    .filter((t) => {
      const d = new Date(t.date)
      const ago = new Date()
      ago.setDate(ago.getDate() - 30)
      return d >= ago
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t) => ({
      date: format(parseISO(t.date), "dd/MM", { locale: ptBR }),
      resultado: t.result,
      ativo: t.asset,
    }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm">Visão geral da sua performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Capital Atual"
          value={formatBRL(currentCapital)}
          icon={<TrendingUp className="w-4 h-4" />}
          color={currentCapital >= initialCapital ? "emerald" : "red"}
        />
        <MetricCard
          title="P&L Total"
          value={formatBRL(stats.totalPnL)}
          icon={<Activity className="w-4 h-4" />}
          color={stats.totalPnL >= 0 ? "emerald" : "red"}
          sub={`${stats.totalTrades} operações`}
        />
        <MetricCard
          title="Taxa de Acerto"
          value={`${(stats.winRate * 100).toFixed(1)}%`}
          icon={<Target className="w-4 h-4" />}
          color={stats.winRate >= 0.5 ? "emerald" : "amber"}
        />
        <MetricCard
          title="Fator de Lucro"
          value={isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : "∞"}
          icon={<TrendingDown className="w-4 h-4" />}
          color={stats.profitFactor >= 1.5 ? "emerald" : stats.profitFactor >= 1 ? "amber" : "red"}
          sub={`Avg win: ${formatBRL(stats.avgWin)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-300">Curva de Capital</CardTitle>
          </CardHeader>
          <CardContent>
            {equityCurve.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} tickLine={false} />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    tickLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ background: "#1F2937", border: "1px solid #374151", borderRadius: 8 }}
                    formatter={(v) => [formatBRL(Number(v)), "Capital"]}
                  />
                  <Line type="monotone" dataKey="equity" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Adicione trades para ver a curva de capital" />
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-300">Resultados (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {last30.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={last30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} tickLine={false} />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    tickLine={false}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: "#1F2937", border: "1px solid #374151", borderRadius: 8 }}
                    formatter={(v) => [formatBRL(Number(v)), "Resultado"]}
                  />
                  <Bar dataKey="resultado" radius={[4, 4, 0, 0]}>
                    {last30.map((entry, i) => (
                      <Cell key={i} fill={entry.resultado >= 0 ? "#10B981" : "#EF4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Nenhuma operação nos últimos 30 dias" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm text-gray-300">Últimas Operações</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Nenhuma operação registrada. Vá para Diário de Trades para começar.
            </p>
          ) : (
            <div className="space-y-2">
              {trades.slice(0, 8).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-white text-sm">{t.asset}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${t.type === "day_trade" ? "border-blue-500/50 text-blue-400" : "border-purple-500/50 text-purple-400"}`}
                    >
                      {t.type === "day_trade" ? "DT" : "SW"}
                    </Badge>
                    <span className="text-gray-400 text-xs">{t.date}</span>
                  </div>
                  <span className={`font-mono font-semibold text-sm ${t.result >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatBRL(t.result)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title, value, icon, color, sub,
}: {
  title: string; value: string; icon: React.ReactNode; color: "emerald" | "red" | "amber"; sub?: string
}) {
  const colors = { emerald: "text-emerald-400", red: "text-red-400", amber: "text-amber-400" }
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-xs">{title}</span>
          <span className={colors[color]}>{icon}</span>
        </div>
        <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <p className="text-gray-500 text-sm text-center">{message}</p>
    </div>
  )
}
