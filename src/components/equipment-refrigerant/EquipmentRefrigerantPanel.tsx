import { useMemo, useState } from 'react'
import { Droplets, Edit3, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  createRefrigerantHistoryEntry,
  deleteRefrigerantHistoryEntry,
  loadEquipmentRefrigerantHistory,
  loadInventoryAssets,
  updateRefrigerantHistoryEntry,
} from '@/lib/assetInventoryStorage'
import { EquipmentHistoryTarget, RefrigerantHistoryAction, RefrigerantHistoryDraft, RefrigerantHistoryEntry } from '@/types'

interface EquipmentRefrigerantPanelProps {
  equipment: EquipmentHistoryTarget
}

const FLUID_ACTIONS: RefrigerantHistoryAction[] = ['Adicionado', 'Complementado', 'Removido', 'Recuperado', 'Ajuste']

function buildEmptyDraft(): RefrigerantHistoryDraft {
  return {
    date: '',
    time: '',
    action: 'Adicionado',
    refrigerantType: '',
    quantity: 0,
    unit: 'kg',
    observations: '',
  }
}

export function EquipmentRefrigerantPanel({ equipment }: EquipmentRefrigerantPanelProps) {
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [draft, setDraft] = useState<RefrigerantHistoryDraft>(buildEmptyDraft)
  const [formError, setFormError] = useState('')

  const canEdit = user?.role === 'admin' || user?.role === 'manager'
  const entries = useMemo(() => loadEquipmentRefrigerantHistory(equipment.id), [equipment.id, version])
  const fluidSuggestions = useMemo(
    () =>
      loadInventoryAssets()
        .filter(
          (asset) =>
            asset.category === 'Fluido Refrigerante' &&
            asset.clientName === equipment.client &&
            (!asset.siteId || asset.siteId === equipment.siteId)
        )
        .map((asset) => asset.name),
    [equipment.client, equipment.siteId, version]
  )

  const closeForm = () => {
    setDraft(buildEmptyDraft())
    setEditingEntryId(null)
    setFormError('')
    setIsFormOpen(false)
  }

  const openCreateForm = () => {
    setDraft(buildEmptyDraft())
    setEditingEntryId(null)
    setFormError('')
    setIsFormOpen(true)
  }

  const openEditForm = (entry: RefrigerantHistoryEntry) => {
    setDraft({
      date: entry.date,
      time: entry.time,
      action: entry.action,
      refrigerantType: entry.refrigerantType,
      quantity: entry.quantity,
      unit: entry.unit,
      observations: entry.observations,
    })
    setEditingEntryId(entry.id)
    setFormError('')
    setIsFormOpen(true)
  }

  const handleSave = () => {
    if (!user || !canEdit) {
      setFormError('Seu perfil nao possui permissao para alterar este historico.')
      return
    }

    if (!draft.date || !draft.time || !draft.refrigerantType.trim() || draft.quantity <= 0 || !draft.unit.trim()) {
      setFormError('Preencha data, hora, fluido, quantidade e unidade.')
      return
    }

    if (editingEntryId) {
      updateRefrigerantHistoryEntry(equipment, editingEntryId, draft, user)
    } else {
      createRefrigerantHistoryEntry(equipment, draft, user)
    }

    setVersion((current) => current + 1)
    closeForm()
  }

  const handleDelete = (entryId: string) => {
    if (!user || !canEdit) {
      return
    }

    deleteRefrigerantHistoryEntry(equipment, entryId, user)
    setVersion((current) => current + 1)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Consumo de fluido refrigerante</p>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">{equipment.name}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              Registre manualmente adicoes, complementos e recuperacoes de fluido deste equipamento. Cada alteracao fica
              rastreada e tambem alimenta a timeline do ativo.
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo registro
            </button>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {editingEntryId ? 'Editar consumo de fluido' : 'Registrar consumo de fluido'}
              </h4>
              <p className="mt-1 text-sm text-gray-500">O historico inicia vazio e deve ser preenchido manualmente.</p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Data</span>
              <input
                type="date"
                value={draft.date}
                onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Hora</span>
              <input
                type="time"
                value={draft.time}
                onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Acao</span>
              <select
                value={draft.action}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, action: event.target.value as RefrigerantHistoryAction }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {FLUID_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Tipo de fluido</span>
              <input
                list={`fluids-${equipment.id}`}
                type="text"
                value={draft.refrigerantType}
                onChange={(event) => setDraft((current) => ({ ...current, refrigerantType: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="R410A, R32, R22..."
              />
              <datalist id={`fluids-${equipment.id}`}>
                {fluidSuggestions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Quantidade</span>
              <input
                type="number"
                min="0"
                step="0.001"
                value={draft.quantity}
                onChange={(event) => setDraft((current) => ({ ...current, quantity: Number(event.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Unidade</span>
              <input
                type="text"
                value={draft.unit}
                onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))}
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

          {formError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Droplets className="mr-2 h-4 w-4" />
              {editingEntryId ? 'Salvar alteracoes' : 'Salvar registro'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                      {entry.action}
                    </span>
                    <span className="text-xs text-gray-500">
                      {entry.date} às {entry.time}
                    </span>
                  </div>
                  <h4 className="mt-3 text-lg font-semibold text-gray-900">
                    {entry.refrigerantType} • {entry.quantity} {entry.unit}
                  </h4>
                  <p className="mt-2 text-sm text-gray-600">{entry.observations || 'Sem observacoes complementares.'}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(entry)}
                      className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Edit3 className="mr-2 h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <Droplets className="mx-auto h-6 w-6 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">Nenhum consumo de fluido registrado para este equipamento.</p>
            <p className="mt-2 text-sm text-gray-500">Os registros iniciam vazios e devem ser cadastrados manualmente.</p>
          </div>
        )}
      </div>
    </div>
  )
}
