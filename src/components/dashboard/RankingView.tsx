import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { SystemRanking } from '../../types'

interface RankingViewProps {
  rankings: SystemRanking[]
}

export function RankingView({ rankings }: RankingViewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking de Sistemas com Mais Problemas</h3>
      <div className="space-y-3">
        {rankings.map((system) => {
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

          return (
            <div key={system.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${system.rank === 1 ? 'bg-danger' : system.rank === 2 ? 'bg-warning' : 'bg-neutral'}`}>
                  {system.rank}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{system.clientName}</p>
                  <p className="text-sm text-gray-500">{system.systemName}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-danger">{system.criticalAlarms}</p>
                  <p className="text-xs text-gray-500">Criticas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{system.totalAlarms}</p>
                  <p className="text-xs text-gray-500">Total</p>
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
