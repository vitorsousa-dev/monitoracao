import { ChangeEvent, useMemo, useState } from 'react'
import { CalendarDays, Clock3, Edit3, Eye, FileText, Image as ImageIcon, Plus, Trash2, UserCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  createEquipmentHistoryEntry,
  deleteEquipmentHistoryEntry,
  fileToStoredAttachment,
  loadEquipmentHistory,
  updateEquipmentHistoryEntry,
} from '@/lib/equipmentHistoryStorage'
import {
  EquipmentHistoryActionType,
  EquipmentHistoryAttachment,
  EquipmentHistoryAuditEvent,
  EquipmentHistoryEntry,
  EquipmentHistoryEntryDraft,
  EquipmentHistoryTarget,
} from '@/types'

interface EquipmentHistoryPanelProps {
  equipment: EquipmentHistoryTarget
}

const ACTION_TYPES: EquipmentHistoryActionType[] = [
  'Inspecao',
  'Manutencao Preventiva',
  'Manutencao Corretiva',
  'Troca de Peca',
  'Falha',
  'Visita Tecnica',
  'Recebimento de Material',
  'Instalacao',
  'Atualizacao',
  'Agendamento',
  'Conclusao',
  'Observacao',
]

function getNowFields() {
  const now = new Date()
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
  }
}

function buildEmptyDraft(responsibleUser: string): EquipmentHistoryEntryDraft {
  const current = getNowFields()
  return {
    date: current.date,
    time: current.time,
    responsibleUser,
    actionType: 'Inspecao',
    description: '',
    observations: '',
    attachments: [],
    photos: [],
  }
}

function mapEntryToDraft(entry: EquipmentHistoryEntry): EquipmentHistoryEntryDraft {
  return {
    date: entry.date,
    time: entry.time,
    responsibleUser: entry.responsibleUser,
    actionType: entry.actionType,
    description: entry.description,
    observations: entry.observations,
    attachments: entry.attachments,
    photos: entry.photos,
  }
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatRecordDate(date: string, time: string) {
  return new Date(`${date}T${time}`).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentList({
  items,
  title,
  editable,
  onRemove,
}: {
  items: EquipmentHistoryAttachment[]
  title: string
  editable: boolean
  onRemove?: (attachmentId: string) => void
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <a
                href={item.dataUrl}
                download={item.name}
                className="font-medium text-primary hover:text-primary/80"
              >
                {item.name}
              </a>
              <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
            </div>
            {editable && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-white"
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineCard({
  entry,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  entry: EquipmentHistoryEntry
  canEdit: boolean
  canDelete: boolean
  onEdit: (entry: EquipmentHistoryEntry) => void
  onDelete: (entryId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasExtraContent =
    Boolean(entry.observations.trim()) || entry.attachments.length > 0 || entry.photos.length > 0

  return (
    <div className="relative pl-8">
      <div className="absolute left-[0.55rem] top-2 h-full w-px bg-gray-200" />
      <div className="absolute left-0 top-2 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-primary shadow-sm" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {entry.actionType}
              </span>
              <span className="text-xs text-gray-500">{formatRecordDate(entry.date, entry.time)}</span>
            </div>
            <p className="mt-3 text-base font-semibold text-gray-900">{entry.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <UserCircle2 className="h-4 w-4" />
                {entry.responsibleUser}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-4 w-4" />
                Atualizado por {entry.updatedBy}
              </span>
            </div>
          </div>
          {(canEdit || canDelete) && (
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Edit3 className="mr-2 h-3.5 w-3.5" />
                  Editar
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Excluir
                </button>
              )}
            </div>
          )}
        </div>

        {hasExtraContent && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Eye className="mr-2 h-3.5 w-3.5" />
              {isExpanded ? 'Ocultar detalhes' : 'Ver mais'}
            </button>

            {isExpanded && (
              <div className="mt-4 space-y-4 rounded-xl bg-slate-50 p-4">
                {entry.observations.trim() && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Observacoes</p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{entry.observations}</p>
                  </div>
                )}
                <AttachmentList items={entry.attachments} title="Arquivos anexos" editable={false} />
                <AttachmentList items={entry.photos} title="Fotos" editable={false} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AuditTrailList({ items }: { items: EquipmentHistoryAuditEvent[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
        Nenhuma alteracao automatica registrada para este equipamento ate o momento.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-gray-900">{item.summary}</p>
            <span className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {item.actorName} •{' '}
            {item.action === 'created'
              ? 'Criacao'
              : item.action === 'updated'
                ? 'Edicao'
                : 'Exclusao'}
          </p>
        </div>
      ))}
    </div>
  )
}

export function EquipmentHistoryPanel({ equipment }: EquipmentHistoryPanelProps) {
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EquipmentHistoryEntryDraft>(() => buildEmptyDraft(user?.name ?? ''))
  const [isUploading, setIsUploading] = useState(false)
  const [formError, setFormError] = useState('')

  const { entries, auditTrail } = useMemo(() => loadEquipmentHistory(equipment.id), [equipment.id, version])
  const canEdit = user?.role === 'admin' || user?.role === 'manager'
  const canCreateDelete = user?.role === 'admin'

  const resetForm = () => {
    setDraft(buildEmptyDraft(user?.name ?? ''))
    setEditingEntryId(null)
    setFormError('')
  }

  const openCreateForm = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEditForm = (entry: EquipmentHistoryEntry) => {
    setDraft(mapEntryToDraft(entry))
    setEditingEntryId(entry.id)
    setFormError('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    resetForm()
  }

  const updateDraftField = <K extends keyof EquipmentHistoryEntryDraft>(key: K, value: EquipmentHistoryEntryDraft[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const appendFiles = async (event: ChangeEvent<HTMLInputElement>, target: 'attachments' | 'photos') => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }

    setIsUploading(true)
    setFormError('')

    try {
      const processedFiles = await Promise.all(files.map((file) => fileToStoredAttachment(file)))
      setDraft((current) => ({
        ...current,
        [target]: [...current[target], ...processedFiles],
      }))
    } catch {
      setFormError('Nao foi possivel carregar um ou mais arquivos.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const removeAttachment = (target: 'attachments' | 'photos', attachmentId: string) => {
    setDraft((current) => ({
      ...current,
      [target]: current[target].filter((item) => item.id !== attachmentId),
    }))
  }

  const handleSubmit = () => {
    if (!user) {
      setFormError('E necessario estar autenticado para salvar registros.')
      return
    }

    if (!canEdit) {
      setFormError('Seu perfil nao possui permissao para alterar este historico.')
      return
    }

    if (!editingEntryId && !canCreateDelete) {
      setFormError('Somente administradores podem criar novos registros.')
      return
    }

    if (!draft.date || !draft.time || !draft.responsibleUser.trim() || !draft.description.trim()) {
      setFormError('Preencha data, hora, responsavel e descricao para salvar.')
      return
    }

    if (editingEntryId) {
      updateEquipmentHistoryEntry(equipment, editingEntryId, draft, user)
    } else {
      createEquipmentHistoryEntry(equipment, draft, user)
    }

    setVersion((current) => current + 1)
    closeForm()
  }

  const handleDelete = (entryId: string) => {
    if (!user || !canCreateDelete) {
      return
    }

    deleteEquipmentHistoryEntry(equipment, entryId, user)
    setVersion((current) => current + 1)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Historico do equipamento</p>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">{equipment.name}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              Linha do tempo permanente para registrar eventos manuais, anexos, fotos e a rastreabilidade do que foi
              alterado neste ativo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCreateDelete ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo registro
              </button>
            ) : (
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
                Apenas administradores podem criar ou excluir registros.
              </span>
            )}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {editingEntryId ? 'Editar registro do historico' : 'Adicionar registro ao historico'}
              </h4>
              <p className="mt-1 text-sm text-gray-500">
                Todos os campos abaixo sao manuais. A auditoria de criacao, edicao e exclusao e registrada
                automaticamente.
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Data</span>
              <input
                type="date"
                value={draft.date}
                onChange={(event) => updateDraftField('date', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Hora</span>
              <input
                type="time"
                value={draft.time}
                onChange={(event) => updateDraftField('time', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Usuario responsavel</span>
              <input
                type="text"
                value={draft.responsibleUser}
                onChange={(event) => updateDraftField('responsibleUser', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nome do responsavel"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Tipo da acao</span>
              <select
                value={draft.actionType}
                onChange={(event) => updateDraftField('actionType', event.target.value as EquipmentHistoryActionType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {ACTION_TYPES.map((actionType) => (
                  <option key={actionType} value={actionType}>
                    {actionType}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 space-y-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Descricao</span>
              <textarea
                value={draft.description}
                onChange={(event) => updateDraftField('description', event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Descreva o evento registrado para este equipamento."
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Observacoes</span>
              <textarea
                value={draft.observations}
                onChange={(event) => updateDraftField('observations', event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Inclua detalhes adicionais, contexto tecnico ou apontamentos relevantes."
              />
            </label>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Arquivos anexos</p>
                  <p className="text-xs text-gray-500">Aceita qualquer tipo de documento carregado manualmente.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  <FileText className="mr-2 h-3.5 w-3.5" />
                  Adicionar
                  <input type="file" multiple className="hidden" onChange={(event) => void appendFiles(event, 'attachments')} />
                </label>
              </div>
              <div className="mt-4">
                <AttachmentList
                  items={draft.attachments}
                  title="Arquivos carregados"
                  editable
                  onRemove={(attachmentId) => removeAttachment('attachments', attachmentId)}
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Fotos</p>
                  <p className="text-xs text-gray-500">Imagens podem ser anexadas para evidenciar a intervencao.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  <ImageIcon className="mr-2 h-3.5 w-3.5" />
                  Adicionar
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => void appendFiles(event, 'photos')}
                  />
                </label>
              </div>
              <div className="mt-4">
                <AttachmentList
                  items={draft.photos}
                  title="Fotos carregadas"
                  editable
                  onRemove={(attachmentId) => removeAttachment('photos', attachmentId)}
                />
              </div>
            </div>
          </div>

          {formError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              {isUploading ? 'Carregando arquivos...' : 'A auditoria tecnica sera registrada automaticamente ao salvar.'}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              {editingEntryId ? 'Salvar alteracoes' : 'Salvar registro'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Timeline vertical</h4>
            <p className="text-sm text-gray-500">Registros manuais associados exclusivamente a este equipamento.</p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <TimelineCard
                key={entry.id}
                entry={entry}
                canEdit={canEdit}
                canDelete={canCreateDelete}
                onEdit={openEditForm}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm font-medium text-gray-700">Nenhum registro manual foi cadastrado para este equipamento.</p>
              <p className="mt-2 text-sm text-gray-500">
                O historico inicia vazio e sera preenchido somente com as informacoes inseridas manualmente.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Rastreabilidade automatica</h4>
          <p className="text-sm text-gray-500">Auditoria gerada automaticamente para criacao, edicao e exclusao.</p>
        </div>
        <AuditTrailList items={auditTrail} />
      </div>
    </div>
  )
}
