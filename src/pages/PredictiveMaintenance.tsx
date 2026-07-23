import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { PredictiveTasks } from '../components/predictive/PredictiveTasks'
import { Plus, Sparkles } from 'lucide-react'
import { useScope } from '@/hooks/useScope'
import { useAuth } from '@/hooks/useAuth'
import { equipmentCatalog } from '@/lib/equipmentCatalog'
import { createPredictiveTask, isPredictiveTaskScoped, loadAllPredictiveTasks } from '@/lib/predictiveTaskStorage'
import { PredictiveTaskDraft } from '@/types'

function buildEmptyPredictiveDraft(equipmentId = ''): PredictiveTaskDraft {
  return {
    equipmentId,
    type: 'inspection',
    title: '',
    description: '',
    technicalAnalysis: '',
    detailedAnalysis: '',
    priority: 'medium',
    dueDate: '',
    status: 'pending',
    riskScore: 50,
    estimatedCost: 0,
  }
}

export function PredictiveMaintenance() {
  const { user } = useAuth()
  const { selectedClient, selectedSite } = useScope()
  const [version, setVersion] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [draft, setDraft] = useState<PredictiveTaskDraft>(() => buildEmptyPredictiveDraft())
  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  const equipmentOptions = useMemo(
    () =>
      equipmentCatalog.filter((equipment) => {
        const matchesClient = selectedClient === 'all-clients' || equipment.client === selectedClient
        const matchesSite = selectedSite === 'all-sites' || equipment.siteId === selectedSite
        return matchesClient && matchesSite
      }),
    [selectedClient, selectedSite]
  )

  useEffect(() => {
    if (!isFormOpen) {
      return
    }

    const firstEquipmentId = equipmentOptions[0]?.id ?? ''
    setDraft((current) => {
      if (current.equipmentId && equipmentOptions.some((equipment) => equipment.id === current.equipmentId)) {
        return current
      }

      return {
        ...current,
        equipmentId: firstEquipmentId,
      }
    })
  }, [equipmentOptions, isFormOpen])

  const visiblePredictiveTasks = useMemo(() => {
    return loadAllPredictiveTasks()
      .filter((task) => isPredictiveTaskScoped(task, selectedClient, selectedSite))
      .sort((a, b) => {
        const dateA = a.createdAt ?? a.dueDate
        const dateB = b.createdAt ?? b.dueDate
        return dateB.localeCompare(dateA)
      })
  }, [selectedClient, selectedSite, version])

  const resetForm = () => {
    setDraft(buildEmptyPredictiveDraft(equipmentOptions[0]?.id ?? ''))
    setFormError('')
  }

  const openForm = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    resetForm()
  }

  const handleCreateTask = () => {
    if (!user || !canEdit) {
      setFormError('Seu perfil nao possui permissao para criar analises preditivas.')
      return
    }

    if (
      !draft.equipmentId ||
      !draft.title.trim() ||
      !draft.description.trim() ||
      !draft.technicalAnalysis.trim() ||
      !draft.dueDate
    ) {
      setFormError('Preencha equipamento, titulo, descricao, analise tecnica e vencimento.')
      return
    }

    if (draft.riskScore < 0 || draft.riskScore > 100) {
      setFormError('O score de risco deve ficar entre 0 e 100.')
      return
    }

    if (draft.estimatedCost < 0) {
      setFormError('O custo estimado nao pode ser negativo.')
      return
    }

    const result = createPredictiveTask(draft, user)
    if (!result.success) {
      setFormError(result.message ?? 'Nao foi possivel salvar a analise preditiva.')
      return
    }

    setVersion((current) => current + 1)
    closeForm()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manutencao Preditiva</h1>
            <p className="text-gray-500">Analises tecnicas por equipamento com foco em falhas recorrentes</p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openForm}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova analise preditiva
            </button>
          )}
        </div>

        {isFormOpen && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Cadastrar analise preditiva manual</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Registre manualmente uma condicao preditiva vinculada ao equipamento do escopo atual.
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

            {equipmentOptions.length > 0 ? (
              <>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Equipamento</span>
                    <select
                      value={draft.equipmentId}
                      onChange={(event) => setDraft((current) => ({ ...current, equipmentId: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Selecione</option>
                      {equipmentOptions.map((equipment) => (
                        <option key={equipment.id} value={equipment.id}>
                          {equipment.name} - {equipment.client}
                          {equipment.siteName ? ` - ${equipment.siteName}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Tipo</span>
                    <select
                      value={draft.type}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, type: event.target.value as PredictiveTaskDraft['type'] }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="inspection">Inspecao</option>
                      <option value="maintenance">Manutencao</option>
                      <option value="replacement">Substituicao</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Prioridade</span>
                    <select
                      value={draft.priority}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          priority: event.target.value as PredictiveTaskDraft['priority'],
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baixa</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <select
                      value={draft.status}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, status: event.target.value as PredictiveTaskDraft['status'] }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="completed">Concluido</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Vencimento</span>
                    <input
                      type="date"
                      value={draft.dueDate}
                      onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Score de risco</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={draft.riskScore}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, riskScore: Number(event.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2 xl:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Titulo</span>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Custo estimado</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.estimatedCost}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, estimatedCost: Number(event.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>

                <div className="mt-4 space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700">Descricao executiva</span>
                    <textarea
                      value={draft.description}
                      onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700">Analise tecnica</span>
                    <textarea
                      value={draft.technicalAnalysis}
                      onChange={(event) => setDraft((current) => ({ ...current, technicalAnalysis: event.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700">Detalhamento tecnico</span>
                    <textarea
                      value={draft.detailedAnalysis}
                      onChange={(event) => setDraft((current) => ({ ...current, detailedAnalysis: event.target.value }))}
                      rows={5}
                      placeholder="Use uma linha por evidencia, recomendacao ou observacao."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>

                {formError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {formError}
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateTask}
                    className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Salvar analise preditiva
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-slate-50 p-6 text-sm text-gray-500">
                Nao ha equipamentos disponiveis no escopo atual para vincular uma analise preditiva manual.
              </div>
            )}
          </div>
        )}

        {visiblePredictiveTasks.length > 0 ? (
          <PredictiveTasks tasks={visiblePredictiveTasks} />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Análises Técnicas Preditivas</h3>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Nao ha tarefas preditivas cadastradas para o cliente/site selecionado.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
