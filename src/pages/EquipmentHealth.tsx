import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EquipmentCard } from '@/components/equipment/EquipmentCard'
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters'
import { mockAlarms, mockEquipment } from '@/lib/mockData'
import { SERASA_SITE_ID } from '@/lib/equipmentCatalog'
import { loadAllPredictiveTasks } from '@/lib/predictiveTaskStorage'
import { buildEquipmentJustification } from '@/lib/utils'
import { useScope } from '@/hooks/useScope'
import { WEST_CORP_CLIENT, WEST_CORP_SITE_ID, WEST_CORP_SITE_NAME, westCorpSystems } from '@/lib/westCorpData'
import { westCorpUnitHealthRollups } from '@/lib/westCorpOperationalData'

function getEquipmentSiteId(equipment: { client: string; siteId?: string }) {
  return equipment.siteId ?? (equipment.client === 'Serasa Experian' ? SERASA_SITE_ID : undefined)
}

export function EquipmentHealth() {
  const { selectedClient, selectedSite } = useScope()
  const predictiveTasks = useMemo(() => loadAllPredictiveTasks(), [])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedSystemId, setSelectedSystemId] = useState<string>('')

  const isWestCorpSelected =
    selectedSite === WEST_CORP_SITE_ID ||
    (selectedClient === WEST_CORP_CLIENT && selectedSite === 'all-sites')

  const filteredEquipment = useMemo(() => {
    if (isWestCorpSelected) {
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
  }, [isWestCorpSelected, searchTerm, selectedClient, selectedSite, statusFilter, typeFilter])

  const stats = useMemo(() => {
    const scopedEquipment = isWestCorpSelected
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
  }, [isWestCorpSelected, selectedClient, selectedSite])

  const filteredWestCorpSystems = useMemo(() => {
    if (!isWestCorpSelected) {
      return []
    }

    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return westCorpSystems
    }

    return westCorpSystems.filter((system) => {
      const haystack = [
        system.systemName,
        ...system.outdoorUnits,
        ...system.internalUnits,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [isWestCorpSelected, searchTerm])

  useEffect(() => {
    if (!isWestCorpSelected) {
      setSelectedSystemId('')
      return
    }

    const nextSystemId = filteredWestCorpSystems[0]?.id ?? ''
    setSelectedSystemId((current) => {
      if (current && filteredWestCorpSystems.some((system) => system.id === current)) {
        return current
      }
      return nextSystemId
    })
  }, [filteredWestCorpSystems, isWestCorpSelected])

  const selectedWestCorpSystem = filteredWestCorpSystems.find((system) => system.id === selectedSystemId)
  const selectedWestCorpUnits = useMemo(
    () => westCorpUnitHealthRollups.filter((unit) => unit.systemId === selectedSystemId),
    [selectedSystemId]
  )
  const westCorpSummary = useMemo(
    () => ({
      totalSystems: westCorpSystems.length,
      totalOutdoorUnits: westCorpSystems.reduce((sum, system) => sum + system.outdoorUnits.length, 0),
      totalInternalUnits: westCorpSystems.reduce((sum, system) => sum + system.internalUnits.length, 0),
      vacantSystems: westCorpSystems.filter((system) => system.status === 'vacant').length,
      totalAlerts: westCorpUnitHealthRollups.reduce((sum, unit) => sum + unit.totalAlerts, 0),
    }),
    []
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saúde dos Equipamentos</h1>
          <p className="text-gray-500">
            {isWestCorpSelected
              ? 'Visualização estruturada por sistemas e unidades internas do site West Corp'
              : 'Monitoramento detalhado de todos os equipamentos'}
          </p>
        </div>

        {isWestCorpSelected ? (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">Cliente e site</p>
                  <h2 className="mt-1 text-xl font-semibold text-gray-900">{WEST_CORP_SITE_NAME}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                    Estrutura cadastrada por sistema para facilitar a navegação das unidades internas do site
                    {` ${WEST_CORP_CLIENT}`}. As métricas individuais podem ser enriquecidas depois com a telemetria
                    operacional de cada sistema.
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                  Modo de visualização por sistema habilitado para o site selecionado.
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Sistemas</p>
                  <p className="text-2xl font-bold text-gray-900">{westCorpSummary.totalSystems}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Condensadoras</p>
                  <p className="text-2xl font-bold text-gray-900">{westCorpSummary.totalOutdoorUnits}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Unidades internas</p>
                  <p className="text-2xl font-bold text-gray-900">{westCorpSummary.totalInternalUnits}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500 mb-1">Sistemas vagos</p>
                  <p className="text-2xl font-bold text-gray-900">{westCorpSummary.vacantSystems}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Alertas carregados (mai/jun)</p>
                  <p className="text-2xl font-bold text-gray-900">{westCorpSummary.totalAlerts}</p>
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
                {filteredWestCorpSystems.map((system) => (
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

            {selectedWestCorpSystem ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900">{selectedWestCorpSystem.systemName}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedWestCorpSystem.status === 'vacant'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {selectedWestCorpSystem.status === 'vacant' ? 'Sistema vago' : 'Sistema ativo'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {selectedWestCorpSystem.outdoorUnits.length} condensadora(s),{' '}
                        {selectedWestCorpSystem.internalUnits.length} unidade(s) interna(s) e{' '}
                        {selectedWestCorpUnits.reduce((sum, unit) => sum + unit.totalAlerts, 0)} alerta(s) associado(s).
                      </p>
                    </div>
                    <Link
                      to={`/equipment/west-system-${selectedWestCorpSystem.id}?tab=history`}
                      className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      Abrir historico do sistema
                    </Link>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Condensadoras / ODU</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedWestCorpSystem.outdoorUnits.length > 0 ? (
                        selectedWestCorpSystem.outdoorUnits.map((unit) => (
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
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {selectedWestCorpUnits.length > 0 ? (
                    selectedWestCorpUnits.map((unit) => (
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
                    ))
                  ) : (
                    <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                      <p className="text-sm font-medium text-gray-700">
                        Este sistema foi marcado como vago e nao possui unidades internas associadas.
                      </p>
                    </div>
                  )}
                </div>
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
