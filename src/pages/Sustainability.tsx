import { DashboardLayout } from '../components/layout/DashboardLayout'
import { EnergyChart } from '../components/sustainability/EnergyChart'
import { IEERCalculator } from '../components/sustainability/IEERCalculator'
import { WaterChart } from '../components/sustainability/WaterChart'
import { mockEnergyData, mockIEERData, mockWaterData } from '../lib/mockData'

export function Sustainability() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sustentabilidade</h1>
          <p className="text-gray-500">Monitoramento de consumo de energia, agua e eficiencia</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnergyChart data={mockEnergyData} />
          <WaterChart data={mockWaterData} />
        </div>
        
        <div>
          <IEERCalculator data={mockIEERData} />
        </div>
      </div>
    </DashboardLayout>
  )
}
