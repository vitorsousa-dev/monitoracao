import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters'
import { EquipmentCard } from '@/components/equipment/EquipmentCard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useScope } from '@/hooks/useScope'
import { SERASA_SITE_ID } from '@/lib/equipmentCatalog'
import { mockAlarms, mockEquipment } from '@/lib/mockData'
import { loadAllPredictiveTasks } from '@/lib/predictiveTaskStorage'
import {
  SBA_TORRES_BRASIL_CLIENT,
  SBA_TORRES_BRASIL_SITE_ID,
  SBA_TORRES_BRASIL_SITE_NAME,
  sbaTorresBrasilSystems,
} from '@/lib/sbaTorresBrasilData'
import {
  sbaTorresBrasilMonthlyEquipmentSnapshots,
  sbaTorresBrasilUnitHealthRollups,
} from '@/lib/sbaTorresBrasilOperationalData'
import { buildEquipmentJustification } from '@/lib/utils'
import { westCorpUnitHealthRollups } from '@/lib/westCorpOperationalData'
import { WEST_CORP_CLIENT, WEST_CORP_SITE_ID, WEST_CORP_SITE_NAME, westCorpSystems } from '@/lib/westCorpData'
import { EquipmentMonthlySnapshot, SiteSystemCatalog } from '@/types'

function getEquipmentSiteId(equipment: { client: string; siteId?: string }) {
  return equipment.siteId ?? (equipment.client === 'Serasa Experian' ? SERASA_SITE_ID : undefined)
}

interface StructuredUnitRollup {
  id: string
  unitName: string
  systemId: string
  systemName: string
  unitType: 'ODU' | 'IDU' | 'SYSTEM'
  totalAlerts: number
  health: number
  availability: number
  mttr: number
  status: 'Verde' | 'Amarelo' | 'Vermelho'
  lastAlertAt: string
}

interface StructuredSiteConfig {
  client: string
  siteId: string
  siteName: string
  systems: SiteSystemCatalog[]
  systemSnapshots?: EquipmentMonthlySnapshot[]
  description: string
  telemetryBadge: string
  emptyTelemetryMessage: string
  unitRollups?: StructuredUnitRollup[]
}

const structuredSiteConfigs: StructuredSiteConfig[] = [
  {
    client: WEST_CORP_CLIENT,
    siteId: WEST_CORP_SITE_ID,
    siteName: WEST_CORP_SITE_NAME,
    systems: westCorpSystems,
    systemSnapshots: undefined,
    description:
      'Estrutura cadastrada por sistema para facilitar a navegacao das unidades internas do site selecionado.',
    telemetryBadge: 'Telemetria operacional carregada para as unidades deste site.',
    emptyTelemetryMessage: 'Este sistema foi marcado como vago e nao possui unidades internas associadas.',
    unitRollups: westCorpUnitHealthRollups,
  },
  {
    client: SBA_TORRES_BRASIL_CLIENT,
    siteId: SBA_TORRES_BRASIL_SITE_ID,
    siteName: SBA_TORRES_BRASIL_SITE_NAME,
    systems: sbaTorresBrasilSystems,
    systemSnapshots: sbaTorresBrasilMonthlyEquipmentSnapshots,
    description:
      'Estrutura inicial cadastrada por sistema, com ODU e unidades internas individualizadas conforme informado.',
    telemetryBadge: 'Telemetria de maio e junho carregada para os sistemas e equipamentos enviados.',
    emptyTelemetryMessage:
      'Sem telemetria operacional carregada para este sistema. As unidades internas cadastradas estao listadas abaixo.',
    unitRollups: sbaTorresBrasilUnitHealthRollups,
  },
]

export function EquipmentHealth() {
  const { selectedClient, selectedSite } = useScope()
  const predictiveTasks = useMemo(() => loadAllPredictiveTasks(), [])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedSystemId, setSelectedSystemId] = useState<string>('')

  const activeStructuredSite = useMemo(
    () =>
      structuredSiteConfigs.find(
        (siteConfig) =>
          selectedSite === siteConfig.siteId ||
          (selectedSite === 'all-sites' && selectedClient === siteConfig.client)
      ) ?? null,
    [selectedClient, selectedSite]
  )

  const isStructuredSiteSelected = Boolean(activeStructuredSite)

  const filteredEquipment = useMemo(() => {
    if (isStructuredSiteSelected) {
      return []
    }

    return mockEquipment.filter((equipment) => {
      const matchesClient = selectedClient === 'all-clients' || equipment.client === selectedClient
      const matchesSite = selectedSite === 'all-sites' || getEquipmentSiteId(equipment) === selectedSite
      const matchesSearch =
        equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.area.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !statusFilter || equipment.status === statusFilter
      const matchesType = !typeFilter || equipment.type === typeFilter

      return matchesClient && matchesSite && matchesSearch && matchesStatus && matchesType
    })
  }, [isStructuredSiteSelected, searchTerm, selectedClient, selectedSite, statusFilter, typeFilter])

  const stats = useMemo(() => {
    const scopedEquipment = isStructuredSiteSelected
      ? []
      : mockEquipment.filter((equipment) => {
          const matchesClient = selectedClient === 'all-clients' || equipment.client === selectedClient
          const matchesSite = selectedSite === 'all-sites' || getEquipmentSiteId(equipment) === selectedSite
          return matchesClient && matchesSite
        })

    return {
      total: scopedEquipment.length,
      healthy: scopedEquipment.filter((equipment) => equipment.status === 'Verde').length,
      warning: scopedEquipment.filter((equipment) => equipment.status === 'Amarelo').length,
      critical: scopedEquipment.filter((equipment) => equipment.status === 'Vermelho').length,
    }
  }, [isStructuredSiteSelected, selectedClient, selectedSite])

  const filteredStructuredSystems = useMemo(() => {
    if (!activeStructuredSite) {
      return []
    }

    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return activeStructuredSite.systems
    }

    return activeStructuredSite.systems.filter((system) => {
      const haystack = [system.systemName, ...system.outdoorUnits, ...system.internalUnits]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [activeStructuredSite, searchTerm])

  useEffect(() => {
    if (!activeStructuredSite) {
      setSelectedSystemId('')
      return
    }

    const nextSystemId = filteredStructuredSystems[0]?.id ?? ''
    setSelectedSystemId((current) => {
      if (current && filteredStructuredSystems.some((system) => system.id === current)) {
        return current
      }
      return nextSystemId
    })
  }, [activeStructuredSite, filteredStructuredSystems])

  const selectedStructuredSystem = filteredStructuredSystems.find((system) => system.id === selectedSystemId)
  const selectedStructuredUnits = useMemo(
    () => activeStructuredSite?.unitRollups?.filter((unit) => unit.systemId === selectedSystemId) ?? [],
    [activeStructuredSite, selectedSystemId]
  )
  const selectedStructuredSnapshot = useMemo(() => {
    if (!activeStructuredSite || !selectedStructuredSystem) {
      return null
    }

    return (
      activeStructuredSite.systemSnapshots?.find((snapshot) => snapshot.name === selectedStructuredSystem.systemName) ?? null
    )
  }, [activeStructuredSite, selectedStructuredSystem])
  const structuredSummary = useMemo(() => {
    if (!activeStructuredSite) {
      return null
    }

    const unitRollups = activeStructuredSite.unitRollups ?? []
    const systemSnapshots = activeStructuredSite.systemSnapshots ?? []

    return {
      totalSystems: activeStructuredSite.systems.length,
      totalOutdoorUnits: activeStructuredSite.systems.reduce((sum, system) => sum + system.outdoorUnits.length, 0),
      totalInternalUnits: activeStructuredSite.systems.reduce((sum, system) => sum + system.internalUnits.length, 0),
      vacantSystems: activeStructuredSite.systems.filter((system) => system.status === 'vacant').length,
      totalAlerts:
        systemSnapshots.length > 0
          ? systemSnapshots.reduce((sum, snapshot) => sum + snapshot.totalOccurrences, 0)
          : unitRollups.reduce((sum, unit) => sum + unit.totalAlerts, 0),
      hasTelemetry: unitRollups.length > 0 || systemSnapshots.length > 0,
    }
  }, [activeStructuredSite])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saúde dos Equipamentos</h1>
          <p className="text-gray-500">
            {activeStructuredSite
              ? `Visualizacao estruturada por sistemas e unidades internas do site ${activeStructuredSite.siteName}`
              : 'Monitoramento detalhado de todos os equipamentos'}
          </p>
        </div>

        {activeStructuredSite && structuredSummary ? (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">Cliente e site</p>
                  <h2 className="mt-1 text-xl font-semibold text-gray-900">{activeStructuredSite.siteName}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                    {activeStructuredSite.description}
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                  {activeStructuredSite.telemetryBadge}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Sistemas</p>
                  <p className="text-2xl font-bold text-gray-900">{structuredSummary.totalSystems}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Condensadoras</p>
                  <p className="text-2xl font-bold text-gray-900">{structuredSummary.totalOutdoorUnits}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Unidades internas</p>
                  <p className="text-2xl font-bold text-gray-900">{structuredSummary.totalInternalUnits}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Sistemas vagos</p>
                  <p className="text-2xl font-bold text-gray-900">{structuredSummary.vacantSystems}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">
                    {structuredSummary.hasTelemetry ? 'Alertas carregados' : 'Telemetria operacional'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {structuredSummary.hasTelemetry ? structuredSummary.totalAlerts : 'Pendente'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Abas de sistemas</h3>
                  <p className="text-sm text-gray-500">
                    Clique em um sistema para liberar a visualização das respectivas unidades internas.
                  </p>
                </div>
                <div className="w-full lg:max-w-sm">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Pesquisar sistema, ODU ou unidade interna..."
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {filteredStructuredSystems.map((system) => (
                  <button
                    key={system.id}
                    type="button"
                    onClick={() => setSelectedSystemId(system.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedSystemId === system.id
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/30 hover:text-primary'
                    }`}
                  >
                    {system.systemName}
                  </button>
                ))}
              </div>
            </div>

            {selectedStructuredSystem ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900">{selectedStructuredSystem.systemName}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedStructuredSystem.status === 'vacant'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {selectedStructuredSystem.status === 'vacant' ? 'Sistema vago' : 'Sistema ativo'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {selectedStructuredSystem.outdoorUnits.length} condensadora(s),{' '}
                        {selectedStructuredSystem.internalUnits.length} unidade(s) interna(s)
                        {selectedStructuredUnits.length > 0
                          ? ` e ${selectedStructuredUnits.reduce((sum, unit) => sum + unit.totalAlerts, 0)} alerta(s) associado(s).`
                          : selectedStructuredSnapshot
                            ? `, ${selectedStructuredSnapshot.totalOccurrences} ocorrencia(s) no periodo e ${selectedStructuredSnapshot.criticalOccurrences} evento(s) critico(s).`
                            : '.'}
                      </p>
                    </div>
                    {selectedStructuredUnits.length > 0 ? (
                      <Link
                        to={`/equipment/west-system-${selectedStructuredSystem.id}?tab=history`}
                        className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        Abrir historico do sistema
                      </Link>
                    ) : (
                      <span className="inline-flex items-center rounded-lg border border-dashed border-gray-200 px-4 py-2 text-sm font-medium text-gray-500">
                        Historico detalhado sera habilitado apos o carregamento da telemetria
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Condensadoras / ODU</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedStructuredSystem.outdoorUnits.length > 0 ? (
                        selectedStructuredSystem.outdoorUnits.map((unit) => (
                          <span
                            key={unit}
                            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
                          >
                            {unit}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-dashed border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500">
                          Sem ODU informada neste cadastro
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedStructuredSnapshot ? (
                    <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500 mb-1">Eventos Críticos</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedStructuredSnapshot.totalOccurrences}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500 mb-1">Índice de Saúde dos Ativos</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedStructuredSnapshot.health}%</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500 mb-1">Disponibilidade Operacional</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedStructuredSnapshot.availability}%</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500 mb-1">MTTR (Médio)</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedStructuredSnapshot.mttr}h</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {selectedStructuredUnits.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {selectedStructuredUnits.map((unit) => (
                      <div key={unit.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                              {unit.unitType === 'ODU' ? 'Unidade externa' : unit.unitType === 'SYSTEM' ? 'Agregador do sistema' : 'Unidade interna'}
                            </p>
                            <h4 className="mt-2 text-lg font-semibold text-gray-900">{unit.unitName}</h4>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              unit.status === 'Verde'
                                ? 'bg-green-50 text-green-700'
                                : unit.status === 'Amarelo'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {unit.status}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-gray-500">Saúde</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{unit.health}%</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-gray-500">Disp.</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{unit.availability}%</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-gray-500">Alertas</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{unit.totalAlerts}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">
                          Ultimo registro: {unit.lastAlertAt}
                        </p>
                        <div className="mt-4">
                          <Link
                            to={`/equipment/${unit.id}?tab=history`}
                            className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            Abrir historico da unidade
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedStructuredSystem.internalUnits.length > 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Unidades internas cadastradas</h4>
                        <p className="text-sm text-gray-500">{activeStructuredSite.emptyTelemetryMessage}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-gray-600">
                        {selectedStructuredSystem.internalUnits.length} unidade(s) interna(s) registradas
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {selectedStructuredSystem.internalUnits.map((unit) => (
                        <div key={unit} className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Unidade interna</p>
                          <h5 className="mt-2 text-base font-semibold text-gray-900">{unit}</h5>
                          <p className="mt-2 text-sm leading-6 text-gray-500">
                            Aguardando historico operacional, alarmes e analises preditivas para detalhamento.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                    <p className="text-sm font-medium text-gray-700">{activeStructuredSite.emptyTelemetryMessage}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="text-sm font-medium text-gray-700">Nenhum sistema encontrado com os filtros atuais.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500 mb-1">Verdes</p>
                <p className="text-2xl font-bold text-success">{stats.healthy}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500 mb-1">Amarelos</p>
                <p className="text-2xl font-bold text-warning">{stats.warning}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500 mb-1">Vermelhos</p>
                <p className="text-2xl font-bold text-danger">{stats.critical}</p>
              </div>
            </div>

            <EquipmentFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map((equipment) => (
                <EquipmentCard
                  key={equipment.id}
                  equipment={equipment}
                  justification={buildEquipmentJustification(equipment, mockAlarms, predictiveTasks)}
                />
              ))}
              {filteredEquipment.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">Nenhum equipamento encontrado</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
