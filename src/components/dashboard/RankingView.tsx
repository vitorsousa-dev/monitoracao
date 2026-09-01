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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ranking de Equipamentos com Mais Alarmes</h3>
        <div className="text-xs text-gray-500">
          Contagem de alarmes <strong className="text-gray-800">ativos</strong> (reconhecidos nao contam para o ranking)
        </div>
      </div>
      <div className="space-y-3">
        {visibleRankings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-success/40 bg-success/5 p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
            <p className="mt-2 text-sm font-semibold text-success">Nenhum alarme ativo no período</p>
            <p className="mt-1 text-xs text-gray-500">Todos os alarmes foram reconhecidos. O ranking ficou zerado.</p>
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
                trendIcon = <Minus className="h-4 w-4 text-gray-500" />
                trendColor = 'text-gray-500'
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
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${system.rank === 1 ? 'bg-danger' : system.rank === 2 ? 'bg-warning' : 'bg-neutral'}`}>
                    {system.rank}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{system.clientName}</p>
                    <p className="text-sm text-gray-500">{system.systemName}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-danger">{system.criticalAlarms}</p>
                    <p className="text-xs text-gray-500">Criticas</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-2xl font-bold text-gray-900">{system.totalAlarms}</p>
                      {acked > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          +{acked}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{acked > 0 ? 'Ativos' : 'Total'}</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${healthColor}`}>{system.healthScore}%</p>
                    <p className="text-xs text-gray-500">Saude</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {trendIcon}
                    <span className={trendColor}>{system.trend === 'up' ? 'Melhorando' : system.trend === 'down' ? 'Piorando' : 'Estavel'}</span>
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
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {showAll ? 'Ver menos' : `Ver mais ${rankings.length - 5} itens`}
          </button>
        </div>
      )}
    </div>
  )
}
