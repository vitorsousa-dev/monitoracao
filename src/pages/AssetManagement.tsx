import { useEffect, useMemo, useState } from 'react'
import { Boxes, Edit3, PackagePlus, Plus, Warehouse } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useScope } from '@/hooks/useScope'
import {
  createInventoryAsset,
  loadAssetMovements,
  loadInventoryAssets,
  registerInventoryMovement,
  updateInventoryAsset,
} from '@/lib/assetInventoryStorage'
import { loadAllEquipmentSchedules } from '@/lib/maintenanceWorkflowStorage'
import { mockSites } from '@/lib/mockData'
import {
  InventoryAsset,
  InventoryAssetCategory,
  InventoryAssetDraft,
  InventoryMovementDraft,
  MaintenanceSchedule,
} from '@/types'

const ASSET_CATEGORIES: InventoryAssetCategory[] = ['Fluido Refrigerante', 'Peca', 'Material']
const MOVEMENT_TYPES: InventoryMovementDraft['type'][] = ['Entrada', 'Saida', 'Ajuste']
const CUSTOM_CATEGORY_VALUE = '__custom-category__'

function buildEmptyAssetDraft(clientName = '', siteId = '', siteName = ''): InventoryAssetDraft {
  return {
    clientName,
    siteId: siteId || undefined,
    siteName: siteName || undefined,
    name: '',
    category: 'Peca',
    code: '',
    manufacturer: '',
    quantityCurrent: 0,
    quantityMinimum: 0,
    unit: '',
    storageLocation: '',
    observations: '',
  }
}

function buildEmptyMovementDraft(): InventoryMovementDraft {
  return {
    date: '',
    time: '',
    type: 'Entrada',
    quantity: 0,
    reason: '',
    observations: '',
    relatedEquipmentName: '',
  }
}

function isAssetScoped(asset: InventoryAsset, selectedClient: string, selectedSite: string) {
  const matchesClient = selectedClient === 'all-clients' || asset.clientName === selectedClient
  const matchesSite = selectedSite === 'all-sites' || !asset.siteId || asset.siteId === selectedSite
  return matchesClient && matchesSite
}

function getOpenSchedules(schedules: MaintenanceSchedule[]) {
  return schedules.filter((schedule) => schedule.status === 'Agendado' || schedule.status === 'Em andamento')
}

export function AssetManagement() {
  const { user } = useAuth()
  const { selectedClient, selectedSite, availableClients, availableSites, canSelectAnyClient } = useScope()
  const [version, setVersion] = useState(0)
  const [assetFormOpen, setAssetFormOpen] = useState(false)
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null)
  const [assetError, setAssetError] = useState('')
  const [movementError, setMovementError] = useState('')
  const [draft, setDraft] = useState<InventoryAssetDraft>(() => buildEmptyAssetDraft())
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [movementDrafts, setMovementDrafts] = useState<Record<string, InventoryMovementDraft>>({})
  const [movementVersion, setMovementVersion] = useState(0)

  const canEdit = user?.role === 'admin' || user?.role === 'manager'
  const assets = useMemo(() => loadInventoryAssets(), [version, movementVersion])
  const siteOptionsForDraft = useMemo(
    () =>
      mockSites
        .filter((site) => (!draft.clientName ? true : site.cliente === draft.clientName))
        .map((site) => ({ id: site.siteId, label: site.nome })),
    [draft.clientName]
  )
  const scopedAssets = useMemo(
    () => assets.filter((asset) => isAssetScoped(asset, selectedClient, selectedSite)),
    [assets, selectedClient, selectedSite]
  )
  const categoryOptions = useMemo(() => {
    const dynamicCategories = assets
      .map((asset) => asset.category.trim())
      .filter(Boolean)
      .filter((category) => !ASSET_CATEGORIES.includes(category))

    return [...ASSET_CATEGORIES, ...Array.from(new Set(dynamicCategories))]
  }, [assets])

  const reservationsByAsset = useMemo(() => {
    const reservations = new Map<string, number>()
    const openSchedules = getOpenSchedules(loadAllEquipmentSchedules())

    openSchedules.forEach((schedule) => {
      if (schedule.materialsAppliedAt) {
        return
      }

      schedule.materialsUsed.forEach((material) => {
        reservations.set(material.assetId, (reservations.get(material.assetId) ?? 0) + material.quantity)
      })
    })

    return reservations
  }, [movementVersion, version])

  const clientOptionsForDraft = useMemo(() => {
    if (selectedClient !== 'all-clients') {
      const current = availableClients.find((client) => client.id === selectedClient)
      return current ? [current] : [{ id: selectedClient, label: selectedClient }]
    }

    return availableClients.filter((client) => client.id !== 'all-clients')
  }, [availableClients, selectedClient])

  useEffect(() => {
    if (!assetFormOpen) {
      return
    }

    if (selectedClient === 'all-clients') {
      return
    }

    const scopedSite = selectedSite !== 'all-sites' ? mockSites.find((site) => site.siteId === selectedSite) : undefined

    setDraft((current) => {
      const nextSiteId = selectedSite !== 'all-sites' ? selectedSite : undefined
      const nextSiteName = selectedSite !== 'all-sites' ? scopedSite?.nome : undefined

      if (current.clientName === selectedClient && current.siteId === nextSiteId) {
        return current
      }

      return {
        ...current,
        clientName: selectedClient,
        siteId: nextSiteId,
        siteName: nextSiteName,
      }
    })
  }, [assetFormOpen, selectedClient, selectedSite])

  const resetAssetDraft = () => {
    const fallbackClient =
      selectedClient !== 'all-clients'
        ? selectedClient
        : availableClients.find((client) => client.id !== 'all-clients')?.id ?? ''
    const fallbackSite =
      selectedSite !== 'all-sites'
        ? mockSites.find((site) => site.siteId === selectedSite)
        : mockSites.find((site) => site.cliente === fallbackClient)

    setDraft(
      buildEmptyAssetDraft(
        fallbackClient,
        fallbackSite?.siteId ?? '',
        fallbackSite?.nome ?? ''
      )
    )
    setIsCustomCategory(false)
    setEditingAssetId(null)
    setAssetError('')
  }

  const openCreateForm = () => {
    resetAssetDraft()
    setAssetFormOpen(true)
  }

  const openEditForm = (asset: InventoryAsset) => {
    setDraft({
      clientName: asset.clientName,
      siteId: asset.siteId,
      siteName: asset.siteName,
      name: asset.name,
      category: asset.category,
      code: asset.code,
      manufacturer: asset.manufacturer,
      quantityCurrent: asset.quantityCurrent,
      quantityMinimum: asset.quantityMinimum,
      unit: asset.unit,
      storageLocation: asset.storageLocation,
      observations: asset.observations,
    })
    setIsCustomCategory(!ASSET_CATEGORIES.includes(asset.category))
    setEditingAssetId(asset.id)
    setAssetError('')
    setAssetFormOpen(true)
  }

  const closeAssetForm = () => {
    setAssetFormOpen(false)
    resetAssetDraft()
  }

  const handleSaveAsset = () => {
    if (!user || !canEdit) {
      setAssetError('Seu perfil nao possui permissao para alterar o estoque.')
      return
    }

    if (!draft.clientName.trim() || !draft.category.trim() || !draft.name.trim() || !draft.unit.trim()) {
      setAssetError('Preencha cliente, categoria, nome do item e unidade.')
      return
    }

    if (draft.quantityCurrent < 0 || draft.quantityMinimum < 0) {
      setAssetError('As quantidades nao podem ser negativas.')
      return
    }

    const selectedSiteOption = siteOptionsForDraft.find((site) => site.id === draft.siteId)
    const nextDraft = {
      ...draft,
      siteId: draft.siteId || undefined,
      siteName: draft.siteId ? selectedSiteOption?.label ?? draft.siteName : undefined,
    }

    if (editingAssetId) {
      updateInventoryAsset(editingAssetId, nextDraft, user)
    } else {
      createInventoryAsset(nextDraft, user)
    }

    setVersion((current) => current + 1)
    closeAssetForm()
  }

  const handleMovementChange = (assetId: string, field: keyof InventoryMovementDraft, value: string | number) => {
    setMovementDrafts((current) => ({
      ...current,
      [assetId]: {
        ...(current[assetId] ?? buildEmptyMovementDraft()),
        [field]: value,
      },
    }))
  }

  const handleRegisterMovement = (asset: InventoryAsset) => {
    if (!user || !canEdit) {
      setMovementError('Seu perfil nao possui permissao para registrar movimentacoes.')
      return
    }

    const movementDraft = movementDrafts[asset.id] ?? buildEmptyMovementDraft()
    if (!movementDraft.date || !movementDraft.time || !movementDraft.reason.trim() || movementDraft.quantity <= 0) {
      setMovementError('Preencha data, hora, motivo e quantidade da movimentacao.')
      return
    }

    const result = registerInventoryMovement(asset.id, movementDraft, user)
    if (!result.success) {
      setMovementError(result.message)
      return
    }

    setMovementError('')
    setMovementDrafts((current) => ({
      ...current,
      [asset.id]: buildEmptyMovementDraft(),
    }))
    setMovementVersion((current) => current + 1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestao de Ativos</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
              Controle manual de estoque para materiais, pecas e fluidos utilizados na manutencao. As baixas
              automaticas acontecem somente ao concluir um agendamento com materiais vinculados.
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo ativo
            </button>
          )}
        </div>

        {assetFormOpen && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingAssetId ? 'Editar ativo de estoque' : 'Cadastrar ativo de estoque'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">Todos os campos sao manuais e iniciam sem dados ficticios.</p>
              </div>
              <button
                type="button"
                onClick={closeAssetForm}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Cliente</span>
                <select
                  value={draft.clientName}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      clientName: event.target.value,
                      siteId: undefined,
                      siteName: undefined,
                    }))
                  }
                  disabled={!canSelectAnyClient || selectedClient !== 'all-clients'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {selectedClient === 'all-clients' && <option value="">Selecione</option>}
                  {clientOptionsForDraft.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Site</span>
                <select
                  value={draft.siteId ?? ''}
                  onChange={(event) => {
                    const selectedOption = availableSites.find((site) => site.id === event.target.value)
                    setDraft((current) => ({
                      ...current,
                      siteId: event.target.value || undefined,
                      siteName: selectedOption && event.target.value ? selectedOption.label : undefined,
                    }))
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Estoque central / sem site especifico</option>
                  {siteOptionsForDraft.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Categoria</span>
                <select
                  value={isCustomCategory ? CUSTOM_CATEGORY_VALUE : draft.category}
                  onChange={(event) => {
                    if (event.target.value === CUSTOM_CATEGORY_VALUE) {
                      setIsCustomCategory(true)
                      setDraft((current) => ({ ...current, category: '' }))
                      return
                    }

                    setIsCustomCategory(false)
                    setDraft((current) => ({ ...current, category: event.target.value as InventoryAssetCategory }))
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value={CUSTOM_CATEGORY_VALUE}>Criar nova categoria</option>
                </select>
              </label>
              {isCustomCategory && (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Nova categoria</span>
                  <input
                    type="text"
                    value={draft.category}
                    onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                    placeholder="Digite a nova categoria"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              )}
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Nome</span>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Codigo</span>
                <input
                  type="text"
                  value={draft.code}
                  onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Fabricante</span>
                <input
                  type="text"
                  value={draft.manufacturer}
                  onChange={(event) => setDraft((current) => ({ ...current, manufacturer: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Quantidade atual</span>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={draft.quantityCurrent}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, quantityCurrent: Number(event.target.value) || 0 }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Quantidade minima</span>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={draft.quantityMinimum}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, quantityMinimum: Number(event.target.value) || 0 }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Unidade</span>
                <input
                  type="text"
                  value={draft.unit}
                  onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))}
                  placeholder="un, kg, m, lata"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Local de armazenamento</span>
                <input
                  type="text"
                  value={draft.storageLocation}
                  onChange={(event) => setDraft((current) => ({ ...current, storageLocation: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-gray-700">Observacoes</span>
              <textarea
                value={draft.observations}
                onChange={(event) => setDraft((current) => ({ ...current, observations: event.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {assetError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{assetError}</div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAsset}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                <PackagePlus className="mr-2 h-4 w-4" />
                {editingAssetId ? 'Salvar ativo' : 'Cadastrar ativo'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {scopedAssets.length > 0 ? (
            scopedAssets.map((asset) => {
              const reserved = reservationsByAsset.get(asset.id) ?? 0
              const available = Math.max(0, asset.quantityCurrent - reserved)
              const isExpanded = expandedAssetId === asset.id
              const movements = isExpanded ? loadAssetMovements(asset.id) : []
              const movementDraft = movementDrafts[asset.id] ?? buildEmptyMovementDraft()

              return (
                <div key={asset.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {asset.category}
                        </span>
                        <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                          {asset.clientName}
                        </span>
                        {asset.siteName && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                            {asset.siteName}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-gray-900">{asset.name}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Codigo: {asset.code || 'Nao informado'} • Fabricante: {asset.manufacturer || 'Nao informado'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditForm(asset)}
                          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Edit3 className="mr-2 h-3.5 w-3.5" />
                          Editar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedAssetId((current) => (current === asset.id ? null : asset.id))}
                        className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        <Warehouse className="mr-2 h-3.5 w-3.5" />
                        {isExpanded ? 'Ocultar historico' : 'Ver historico'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-gray-500">Quantidade atual</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {asset.quantityCurrent} {asset.unit}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-gray-500">Reservado</p>
                      <p className="mt-1 text-xl font-bold text-amber-600">
                        {reserved} {asset.unit}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-gray-500">Disponivel</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {available} {asset.unit}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-gray-500">Quantidade minima</p>
                      <p className={`mt-1 text-xl font-bold ${available <= asset.quantityMinimum ? 'text-danger' : 'text-gray-900'}`}>
                        {asset.quantityMinimum} {asset.unit}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      <strong className="font-semibold text-gray-900">Armazenamento:</strong> {asset.storageLocation || 'Nao informado'}
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      <strong className="font-semibold text-gray-900">Observacoes:</strong> {asset.observations || 'Sem observacoes'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 space-y-4 rounded-2xl border border-gray-200 bg-slate-50 p-4">
                      {canEdit && (
                        <div className="rounded-2xl border border-white bg-white p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">Registrar movimentacao</h3>
                              <p className="mt-1 text-xs text-gray-500">
                                Entradas e saidas manuais alimentam automaticamente o historico deste ativo.
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-gray-700">Data</span>
                              <input
                                type="date"
                                value={movementDraft.date}
                                onChange={(event) => handleMovementChange(asset.id, 'date', event.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-gray-700">Hora</span>
                              <input
                                type="time"
                                value={movementDraft.time}
                                onChange={(event) => handleMovementChange(asset.id, 'time', event.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-gray-700">Tipo</span>
                              <select
                                value={movementDraft.type}
                                onChange={(event) => handleMovementChange(asset.id, 'type', event.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              >
                                {MOVEMENT_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-gray-700">Quantidade</span>
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={movementDraft.quantity}
                                onChange={(event) =>
                                  handleMovementChange(asset.id, 'quantity', Number(event.target.value) || 0)
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-gray-700">Equipamento relacionado</span>
                              <input
                                type="text"
                                value={movementDraft.relatedEquipmentName ?? ''}
                                onChange={(event) => handleMovementChange(asset.id, 'relatedEquipmentName', event.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-gray-700">Motivo</span>
                              <input
                                type="text"
                                value={movementDraft.reason}
                                onChange={(event) => handleMovementChange(asset.id, 'reason', event.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </label>
                          </div>
                          <label className="mt-4 block space-y-2">
                            <span className="text-sm font-medium text-gray-700">Observacoes</span>
                            <textarea
                              value={movementDraft.observations}
                              onChange={(event) => handleMovementChange(asset.id, 'observations', event.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </label>

                          {movementError && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                              {movementError}
                            </div>
                          )}

                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRegisterMovement(asset)}
                              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                            >
                              <Boxes className="mr-2 h-4 w-4" />
                              Registrar movimentacao
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="rounded-2xl border border-white bg-white p-4">
                        <h3 className="text-sm font-semibold text-gray-900">Historico de movimentacao</h3>
                        <div className="mt-4 space-y-3">
                          {movements.length > 0 ? (
                            movements.map((movement) => (
                              <div key={movement.id} className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {movement.type} • {movement.quantity} {movement.unit}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      {movement.date} às {movement.time} • {movement.createdBy}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                                    {movement.reason}
                                  </span>
                                </div>
                                <p className="mt-3 text-sm text-gray-600">
                                  {movement.observations || 'Sem observacoes complementares.'}
                                </p>
                                {movement.relatedEquipmentName && (
                                  <p className="mt-2 text-xs text-gray-500">
                                    Equipamento relacionado: {movement.relatedEquipmentName}
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50 p-6 text-center text-sm text-gray-500">
                              Nenhuma movimentacao registrada para este item.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <Boxes className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-700">Nenhum ativo cadastrado para o escopo atual.</p>
              <p className="mt-2 text-sm text-gray-500">
                O estoque inicia vazio e deve ser preenchido manualmente conforme a operacao de cada cliente e site.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
