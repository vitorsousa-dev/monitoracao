import { useMemo, useState } from 'react'
import { CalendarClock, ClipboardCheck, Edit3, Plus, Wrench } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { loadInventoryAssets } from '@/lib/assetInventoryStorage'
import {
  createEquipmentSchedule,
  loadAllEquipmentSchedules,
  loadEquipmentSchedules,
  registerScheduleStep,
  updateEquipmentSchedule,
} from '@/lib/maintenanceWorkflowStorage'
import {
  EquipmentHistoryTarget,
  MaintenanceSchedule,
  MaintenanceScheduleDraft,
  MaintenanceSchedulePriority,
  MaintenanceScheduleStatus,
  MaintenanceScheduleType,
  ScheduleMaterialUsageDraft,
} from '@/types'

interface EquipmentSchedulingPanelProps {
  equipment: EquipmentHistoryTarget
}

const SCHEDULE_TYPES: MaintenanceScheduleType[] = [
  'Preventiva',
  'Corretiva',
  'Preditiva',
  'Inspecao',
  'Visita Tecnica',
  'Acompanhamento',
]

const PRIORITIES: MaintenanceSchedulePriority[] = ['Baixa', 'Media', 'Alta', 'Critica']
const STATUSES: MaintenanceScheduleStatus[] = ['Agendado', 'Em andamento', 'Finalizado', 'Cancelado']
const SCHEDULE_STEPS = [
  'Peca solicitada',
  'Material separado',
  'Tecnico designado',
  'Equipamento em manutencao',
  'Concluido',
] as const

function getNowDraft(): MaintenanceScheduleDraft {
  return {
    date: '',
    time: '',
    technician: '',
    maintenanceType: 'Preventiva',
    priority: 'Media',
    observations: '',
    materialsUsed: [],
    status: 'Agendado',
  }
}

function mapScheduleToDraft(schedule: MaintenanceSchedule): MaintenanceScheduleDraft {
  return {
    date: schedule.date,
    time: schedule.time,
    technician: schedule.technician,
    maintenanceType: schedule.maintenanceType,
    priority: schedule.priority,
    observations: schedule.observations,
    materialsUsed: schedule.materialsUsed.map((material) => ({
      assetId: material.assetId,
      quantity: material.quantity,
      observations: material.observations,
    })),
    status: schedule.status,
  }
}

function formatScheduleDate(date: string, time: string) {
  return new Date(`${date}T${time}`).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function getStatusBadge(status: MaintenanceScheduleStatus) {
  switch (status) {
    case 'Agendado':
      return 'bg-amber-50 text-amber-700'
    case 'Em andamento':
      return 'bg-blue-50 text-blue-700'
    case 'Finalizado':
      return 'bg-green-50 text-green-700'
    case 'Cancelado':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export function EquipmentSchedulingPanel({ equipment }: EquipmentSchedulingPanelProps) {
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [draft, setDraft] = useState<MaintenanceScheduleDraft>(getNowDraft)
  const [selectedStepBySchedule, setSelectedStepBySchedule] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  const schedules = useMemo(() => loadEquipmentSchedules(equipment.id), [equipment.id, version])
  const scopedAssets = useMemo(
    () =>
      loadInventoryAssets().filter(
        (asset) => asset.clientName === equipment.client && (!asset.siteId || asset.siteId === equipment.siteId)
      ),
    [equipment.client, equipment.siteId, version]
  )
  const reservedByAsset = useMemo(() => {
    const reservations = new Map<string, number>()
    const openSchedules = loadAllEquipmentSchedules().filter(
      (schedule) =>
        (schedule.status === 'Agendado' || schedule.status === 'Em andamento') &&
        !schedule.materialsAppliedAt &&
        schedule.id !== editingScheduleId
    )

    openSchedules.forEach((schedule) => {
      schedule.materialsUsed.forEach((material) => {
        reservations.set(material.assetId, (reservations.get(material.assetId) ?? 0) + material.quantity)
      })
    })

    return reservations
  }, [editingScheduleId, version])
  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  const resetForm = () => {
    setDraft(getNowDraft())
    setEditingScheduleId(null)
    setFormError('')
  }

  const openCreateForm = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEditForm = (schedule: MaintenanceSchedule) => {
    setDraft(mapScheduleToDraft(schedule))
    setEditingScheduleId(schedule.id)
    setFormError('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    resetForm()
  }

  const handleMaterialChange = (index: number, field: keyof ScheduleMaterialUsageDraft, value: string | number) => {
    setDraft((current) => ({
      ...current,
      materialsUsed: current.materialsUsed.map((material, materialIndex) =>
        materialIndex === index ? { ...material, [field]: value } : material
      ),
    }))
  }

  const addMaterialRow = () => {
    setDraft((current) => ({
      ...current,
      materialsUsed: [...current.materialsUsed, { assetId: '', quantity: 0, observations: '' }],
    }))
  }

  const removeMaterialRow = (index: number) => {
    setDraft((current) => ({
      ...current,
      materialsUsed: current.materialsUsed.filter((_, materialIndex) => materialIndex !== index),
    }))
  }

  const handleSubmit = () => {
    if (!user) {
      setFormError('E necessario estar autenticado para salvar agendamentos.')
      return
    }

    if (!canEdit) {
      setFormError('Seu perfil nao possui permissao para alterar agendamentos.')
      return
    }

    if (!draft.date || !draft.time || !draft.technician.trim()) {
      setFormError('Preencha data, hora e tecnico responsavel.')
      return
    }

    const hasInvalidMaterials = draft.materialsUsed.some(
      (material) => !material.assetId || !Number.isFinite(material.quantity) || material.quantity <= 0
    )
    if (hasInvalidMaterials) {
      setFormError('Preencha corretamente os materiais utilizados antes de salvar.')
      return
    }

    if (editingScheduleId) {
      updateEquipmentSchedule(equipment, editingScheduleId, draft, user)
    } else {
      createEquipmentSchedule(equipment, draft, user)
    }

    setVersion((current) => current + 1)
    closeForm()
  }

  const handleRegisterStep = (scheduleId: string) => {
    if (!user || !canEdit) {
      return
    }

    const stepLabel = selectedStepBySchedule[scheduleId]
    if (!stepLabel) {
      return
    }

    registerScheduleStep(equipment, scheduleId, user, stepLabel)
    setSelectedStepBySchedule((current) => ({
      ...current,
      [scheduleId]: '',
    }))
    setVersion((current) => current + 1)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Agendamento de manutencao</p>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">{equipment.name}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              Crie quantos agendamentos forem necessarios para este equipamento. Toda movimentacao de status e etapa
              operacional e enviada automaticamente para a timeline.
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo agendamento
            </button>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {editingScheduleId ? 'Editar agendamento' : 'Criar agendamento'}
              </h4>
              <p className="mt-1 text-sm text-gray-500">Os campos abaixo sao totalmente manuais e sem dados pre-preenchidos.</p>
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
              <span className="text-sm font-medium text-gray-700">Tecnico responsavel</span>
              <input
                type="text"
                value={draft.technician}
                onChange={(event) => setDraft((current) => ({ ...current, technician: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nome do tecnico"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Tipo de manutencao</span>
              <select
                value={draft.maintenanceType}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maintenanceType: event.target.value as MaintenanceScheduleType,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SCHEDULE_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Prioridade</span>
              <select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value as MaintenanceSchedulePriority,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as MaintenanceScheduleStatus,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium text-gray-700">Observacao</span>
            <textarea
              value={draft.observations}
              onChange={(event) => setDraft((current) => ({ ...current, observations: event.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Contexto tecnico, pecas, acesso ao local ou qualquer observacao relevante."
            />
          </label>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h5 className="text-sm font-semibold text-gray-900">Materiais utilizados</h5>
                <p className="mt-1 text-xs text-gray-500">
                  Os materiais ficam reservados para esta manutencao e a baixa automatica ocorre somente quando o
                  agendamento for concluido.
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={addMaterialRow}
                  className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Adicionar material
                </button>
              )}
            </div>

            {draft.materialsUsed.length > 0 ? (
              <div className="mt-4 space-y-3">
                {draft.materialsUsed.map((material, index) => {
                  const selectedAsset = scopedAssets.find((asset) => asset.id === material.assetId)
                  const reserved = material.assetId ? reservedByAsset.get(material.assetId) ?? 0 : 0
                  const available = selectedAsset ? Math.max(0, selectedAsset.quantityCurrent - reserved) : 0

                  return (
                    <div key={`${material.assetId || 'material'}-${index}`} className="rounded-xl border border-white bg-white p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <label className="space-y-2 xl:col-span-2">
                          <span className="text-sm font-medium text-gray-700">Item do estoque</span>
                          <select
                            value={material.assetId}
                            onChange={(event) => handleMaterialChange(index, 'assetId', event.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">Selecione um item</option>
                            {scopedAssets.map((asset) => {
                              const itemReserved = reservedByAsset.get(asset.id) ?? 0
                              const itemAvailable = Math.max(0, asset.quantityCurrent - itemReserved)
                              return (
                                <option key={asset.id} value={asset.id}>
                                  {asset.name} • disponivel {itemAvailable} {asset.unit}
                                </option>
                              )
                            })}
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-gray-700">Quantidade</span>
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={material.quantity}
                            onChange={(event) => handleMaterialChange(index, 'quantity', Number(event.target.value) || 0)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </label>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeMaterialRow(index)}
                            className="w-full rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <label className="block flex-1 space-y-2">
                          <span className="text-sm font-medium text-gray-700">Observacao do material</span>
                          <input
                            type="text"
                            value={material.observations}
                            onChange={(event) => handleMaterialChange(index, 'observations', event.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </label>
                        {selectedAsset && (
                          <p className="text-xs text-gray-500">
                            Reservado no momento: {reserved} {selectedAsset.unit} • disponivel: {available} {selectedAsset.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                Nenhum material vinculado a este agendamento.
              </div>
            )}
          </div>

          {formError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              {editingScheduleId ? 'Salvar alteracoes' : 'Salvar agendamento'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {schedules.length > 0 ? (
          schedules.map((schedule) => (
            <div key={schedule.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(schedule.status)}`}>
                      {schedule.status}
                    </span>
                    <span className="text-xs text-gray-500">{formatScheduleDate(schedule.date, schedule.time)}</span>
                  </div>
                  <h4 className="mt-3 text-lg font-semibold text-gray-900">
                    {schedule.maintenanceType} • {schedule.priority}
                  </h4>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-4 w-4" />
                      {schedule.technician}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Wrench className="h-4 w-4" />
                      Atualizado por {schedule.updatedBy}
                    </span>
                  </div>
                  {schedule.observations && <p className="mt-3 text-sm leading-6 text-gray-600">{schedule.observations}</p>}
                  {schedule.materialsUsed.length > 0 && (
                    <div className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Materiais vinculados</p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {schedule.materialsUsed.map((material) => (
                          <p key={material.id}>
                            {material.assetName} • {material.quantity} {material.unit || 'un'}
                            {material.observations ? ` • ${material.observations}` : ''}
                          </p>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {schedule.materialsAppliedAt
                          ? 'Baixa automatica do estoque ja aplicada neste agendamento.'
                          : 'Baixa automatica pendente para o momento da conclusao.'}
                      </p>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => openEditForm(schedule)}
                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Edit3 className="mr-2 h-3.5 w-3.5" />
                    Editar
                  </button>
                )}
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Registrar etapa operacional</p>
                    <p className="text-xs text-gray-500">
                      Cada etapa abaixo alimenta automaticamente a timeline deste equipamento.
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={selectedStepBySchedule[schedule.id] ?? ''}
                        onChange={(event) =>
                          setSelectedStepBySchedule((current) => ({
                            ...current,
                            [schedule.id]: event.target.value,
                          }))
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Selecione uma etapa</option>
                        {SCHEDULE_STEPS.map((step) => (
                          <option key={step} value={step}>
                            {step}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRegisterStep(schedule.id)}
                        className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Registrar etapa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-gray-700">Nenhum agendamento cadastrado para este equipamento.</p>
            <p className="mt-2 text-sm text-gray-500">
              Os agendamentos iniciam vazios e devem ser preenchidos manualmente conforme a operação.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
