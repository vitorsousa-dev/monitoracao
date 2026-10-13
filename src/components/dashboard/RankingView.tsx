import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, ArrowDown, Minus, CheckCircle2 } from 'lucide-react'
import { SystemRanking } from '../../types'

interface RankingViewProps {
  rankings: Array<SystemRanking & { ackedCount?: number }>
}

export function RankingView({ rankings }: RankingViewProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleRankings = useMemo(
    () => (showAll ? rankings : rankings.slice(0, 5)),
    [rankings, showAll]
  )

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">Ranking de Equipamentos com Mais Alarmes</h3>
        <div className="text-xs text-muted">
          Contagem de alarmes <strong className="text-foreground">ativos</strong> (reconhecidos não contam)
        </div>
      </div>
      <div className="space-y-3">
        {visibleRankings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-success/40 bg-success-soft p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
            <p className="mt-2 text-sm font-semibold text-success">Nenhum alarme ativo no período</p>
            <p className="mt-1 text-xs text-muted">Todos os alarmes foram reconhecidos. O ranking ficou zerado.</p>
          </div>
        ) : (
          visibleRankings.map((system) => {
            let trendIcon, trendColor
            switch (system.trend) {
              case 'up':
                trendIcon = <ArrowUp className="h-4 w-4 text-success" />
                trendColor = 'text-success'
                break
              case 'down':
                trendIcon = <ArrowDown className="h-4 w-4 text-danger" />
                trendColor = 'text-danger'
                break
              default:
                trendIcon = <Minus className="h-4 w-4 text-muted" />
                trendColor = 'text-muted'
            }

            const healthColor = system.healthScore >= 90 ? 'text-success' : system.healthScore >= 80 ? 'text-warning' : 'text-danger'
            const acked = system.ackedCount ?? 0
            const targetUrl = system.equipmentId
              ? `/alarms?equipmentId=${encodeURIComponent(system.equipmentId)}&equipmentName=${encodeURIComponent(system.equipmentName ?? system.systemName)}`
              : '/alarms'

            return (
              <Link
                key={system.id}
                to={targetUrl}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface-muted"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${system.rank === 1 ? 'bg-danger' : system.rank === 2 ? 'bg-warning' : 'bg-neutral'}`}>
                    {system.rank}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{system.clientName}</p>
                    <p className="truncate text-sm text-muted">{system.systemName}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-5">
                  <div className="text-center">
                    <p className="text-xl font-bold tabular-nums text-danger">{system.criticalAlarms}</p>
                    <p className="text-xs text-muted">Críticas</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-xl font-bold tabular-nums text-foreground">{system.totalAlarms}</p>
                      {acked > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          +{acked}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">{acked > 0 ? 'Ativos' : 'Total'}</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xl font-bold tabular-nums ${healthColor}`}>{system.healthScore}%</p>
                    <p className="text-xs text-muted">Saúde</p>
                  </div>
                  <div className="hidden items-center gap-1 sm:flex">
                    {trendIcon}
                    <span className={`text-sm ${trendColor}`}>{system.trend === 'up' ? 'Melhorando' : system.trend === 'down' ? 'Piorando' : 'Estável'}</span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
      {rankings.length > 5 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            {showAll ? 'Ver menos' : `Ver mais ${rankings.length - 5} itens`}
          </button>
        </div>
      )}
    </div>
  )
}
