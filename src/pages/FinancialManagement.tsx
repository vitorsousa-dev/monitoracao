import { useEffect, useMemo, useState } from 'react'
import { Banknote, CheckCircle2, ClipboardList, Clock3, Edit3, Plus, Wallet } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useScope } from '@/hooks/useScope'
import {
  buildEmptyFinancialEntryDraft,
  calculateFinancialEntryTotals,
  FINANCIAL_MANAGEMENT_UPDATED_EVENT,
  loadFinancialBudget,
  loadFinancialEntries,
  saveFinancialBudget,
  saveFinancialEntry,
} from '@/lib/financialManagementStorage'
import { loadAllEquipmentSchedules, MAINTENANCE_WORKFLOW_UPDATED_EVENT } from '@/lib/maintenanceWorkflowStorage'
import { FinancialEntry, FinancialEntryDraft, MaintenanceSchedule } from '@/types'

function isScheduleScoped(
  item: Pick<MaintenanceSchedule, 'clientName' | 'siteId'>,
  selectedClient: string,
  selectedSite: string
) {
  const matchesClient = selectedClient === 'all-clients' || item.clientName === selectedClient
  const matchesSite = selectedSite === 'all-sites' || item.siteId === selectedSite
  return matchesClient && matchesSite
}

function getWorkflowBadge(status: MaintenanceSchedule['status']) {
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

function getKanbanLabel(status: FinancialEntry['kanbanStatus']) {
  if (status === 'in_progress') {
    return 'Em tratamento'
  }

  if (status === 'completed') {
    return 'Concluído'
  }

  return 'Ainda não realizado'
}

function getKanbanBadge(status: FinancialEntry['kanbanStatus']) {
  if (status === 'in_progress') {
    return 'bg-blue-50 text-blue-700'
  }

  if (status === 'completed') {
    return 'bg-green-50 text-green-700'
  }

  return 'bg-amber-50 text-amber-700'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

function mapEntryToDraft(entry: FinancialEntry): FinancialEntryDraft {
  return {
    scheduleId: entry.scheduleId,
    plannedRevenue: entry.plannedRevenue,
    laborCost: entry.laborCost,
    materialsCost: entry.materialsCost,
    outsourcedCost: entry.outsourcedCost,
    travelCost: entry.travelCost,
    otherCost: entry.otherCost,
    billedAmount: entry.billedAmount,
    receivedAmount: entry.receivedAmount,
    notes: entry.notes,
  }
}

export function FinancialManagement() {
  const { user } = useAuth()
  const { selectedClient, selectedSite } = useScope()
  const [version, setVersion] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false)
  const [draft, setDraft] = useState<FinancialEntryDraft>(() => buildEmptyFinancialEntryDraft())
  const [budgetDraft, setBudgetDraft] = useState('0')
  const [formError, setFormError] = useState('')
  const [budgetError, setBudgetError] = useState('')
  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    const refresh = () => {
      setVersion((current) => current + 1)
    }

    window.addEventListener(FINANCIAL_MANAGEMENT_UPDATED_EVENT, refresh)
    window.addEventListener(MAINTENANCE_WORKFLOW_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)

    return () => {
      window.removeEventListener(FINANCIAL_MANAGEMENT_UPDATED_EVENT, refresh)
      window.removeEventListener(MAINTENANCE_WORKFLOW_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const scopedSchedules = useMemo(
    () =>
      loadAllEquipmentSchedules()
        .filter((schedule) => isScheduleScoped(schedule, selectedClient, selectedSite))
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [selectedClient, selectedSite, version]
  )

  const scopedEntries = useMemo(
    () =>
      loadFinancialEntries()
        .filter((entry) => isScheduleScoped(entry, selectedClient, selectedSite))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [selectedClient, selectedSite, version]
  )

  const budgetScope =
    selectedClient === 'all-clients'
      ? null
      : {
          clientName: selectedClient,
          siteId: selectedSite === 'all-sites' ? undefined : selectedSite,
          siteName:
            selectedSite === 'all-sites'
              ? undefined
              : scopedSchedules[0]?.siteName ?? scopedEntries[0]?.siteName,
        }

  const currentBudget = useMemo(
    () => (budgetScope ? loadFinancialBudget(budgetScope) : undefined),
    [budgetScope, version]
  )

  const entriesBySchedule = useMemo(
    () => new Map(scopedEntries.map((entry) => [entry.scheduleId, entry])),
    [scopedEntries]
  )

  const rows = useMemo(
    () =>
      scopedSchedules.map((schedule) => ({
        schedule,
        entry: entriesBySchedule.get(schedule.id),
      })),
    [entriesBySchedule, scopedSchedules]
  )

  const metrics = useMemo(() => {
    return scopedEntries.reduce(
      (accumulator, entry) => {
        const totals = calculateFinancialEntryTotals(entry)
        accumulator.totalPlannedRevenue += entry.plannedRevenue
        accumulator.totalBilled += entry.billedAmount
        accumulator.totalReceived += entry.receivedAmount
        accumulator.totalCost += totals.totalCost
        accumulator.totalMargin += totals.margin
        accumulator.pendingToReceive += totals.pendingToReceive
        accumulator.completedCount += entry.workflowStatus === 'Finalizado' ? 1 : 0
        accumulator.inProgressCount += entry.workflowStatus === 'Em andamento' ? 1 : 0
        return accumulator
      },
      {
        totalPlannedRevenue: 0,
        totalBilled: 0,
        totalReceived: 0,
        totalCost: 0,
        totalMargin: 0,
        pendingToReceive: 0,
        completedCount: 0,
        inProgressCount: 0,
      }
    )
  }, [scopedEntries])

  const draftActivityCost = useMemo(
    () =>
      calculateFinancialEntryTotals({
        plannedRevenue: draft.plannedRevenue,
        laborCost: draft.laborCost,
        materialsCost: draft.materialsCost,
        outsourcedCost: draft.outsourcedCost,
        travelCost: draft.travelCost,
        otherCost: draft.otherCost,
        billedAmount: draft.billedAmount,
        receivedAmount: draft.receivedAmount,
      }).totalCost,
    [draft]
  )

  const resetForm = (scheduleId = scopedSchedules[0]?.id ?? '') => {
    setDraft(buildEmptyFinancialEntryDraft(scheduleId))
    setFormError('')
  }

  const openCreateForm = (scheduleId = scopedSchedules[0]?.id ?? '') => {
    resetForm(scheduleId)
    setIsFormOpen(true)
  }

  const openBudgetForm = () => {
    setBudgetDraft(String(currentBudget?.currentBalance ?? 0))
    setBudgetError('')
    setIsBudgetFormOpen(true)
  }

  const openEditForm = (entry: FinancialEntry) => {
    setDraft(mapEntryToDraft(entry))
    setFormError('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    resetForm()
  }

  const closeBudgetForm = () => {
    setIsBudgetFormOpen(false)
    setBudgetError('')
  }

  const handleSubmit = () => {
    if (!user || !canEdit) {
      setFormError('Seu perfil não possui permissão para lançar dados financeiros.')
      return
    }

    const selectedSchedule = scopedSchedules.find((schedule) => schedule.id === draft.scheduleId)
    if (!selectedSchedule) {
      setFormError('Selecione um agendamento válido para registrar o lançamento financeiro.')
      return
    }

    const values = [
      draft.plannedRevenue,
      draft.laborCost,
      draft.materialsCost,
      draft.outsourcedCost,
      draft.travelCost,
      draft.otherCost,
      draft.billedAmount,
      draft.receivedAmount,
    ]

    if (values.some((value) => value < 0)) {
      setFormError('Os valores financeiros não podem ser negativos.')
      return
    }

    saveFinancialEntry(selectedSchedule, draft, user)
    closeForm()
  }

  const handleSaveBudget = () => {
    if (!user || !canEdit) {
      setBudgetError('Seu perfil não possui permissão para atualizar o saldo atual.')
      return
    }

    if (!budgetScope) {
      setBudgetError('Selecione um cliente específico para lançar saldo atual.')
      return
    }

    const parsedValue = Number(budgetDraft)
    if (!Number.isFinite(parsedValue)) {
      setBudgetError('Informe um valor numérico válido para o saldo atual.')
      return
    }

    saveFinancialBudget(
      {
        clientName: budgetScope.clientName,
        siteId: budgetScope.siteId,
        siteName: budgetScope.siteName,
      },
      parsedValue,
      user
    )
    closeBudgetForm()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
            <p className="text-gray-500">
              Lançamentos manuais por atividade agendada, com saldo atual do orçamento e baixa automática ao concluir.
            </p>
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openBudgetForm}
                className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Atualizar saldo atual
              </button>
              <button
                type="button"
                onClick={() => openCreateForm()}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Lançar custo da atividade
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Saldo Atual</h3>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-[2rem] font-bold leading-none text-gray-900">
              {formatCurrency(currentBudget?.currentBalance ?? 0)}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {budgetScope ? 'Orçamento disponível no escopo atual' : 'Selecione um cliente específico para controlar orçamento'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Receita Prevista</h3>
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-[2rem] font-bold leading-none text-gray-900">{formatCurrency(metrics.totalPlannedRevenue)}</p>
            <p className="mt-2 text-sm text-gray-500">{scopedEntries.length} atividades com lançamento financeiro</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Custo Lançado</h3>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-[2rem] font-bold leading-none text-gray-900">{formatCurrency(metrics.totalCost)}</p>
            <p className="mt-2 text-sm text-gray-500">Inclui mão de obra, materiais, terceiros, deslocamento e outros</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Faturado / Recebido</h3>
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-[2rem] font-bold leading-none text-gray-900">{formatCurrency(metrics.totalBilled)}</p>
            <p className="mt-2 text-sm text-gray-500">Recebido até agora: {formatCurrency(metrics.totalReceived)}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Saldo Financeiro</h3>
              {metrics.totalMargin >= 0 ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Clock3 className="h-5 w-5 text-warning" />
              )}
            </div>
            <p className={`mt-3 text-[2rem] font-bold leading-none ${metrics.totalMargin >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(metrics.totalMargin)}
            </p>
            <p className="mt-2 text-sm text-gray-500">Pendente de recebimento: {formatCurrency(metrics.pendingToReceive)}</p>
          </div>
        </div>

        {isBudgetFormOpen && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Saldo atual do orçamento</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Informe manualmente o orçamento atual. As atividades finalizadas dão baixa automática nesse saldo.
                </p>
              </div>
              <button
                type="button"
                onClick={closeBudgetForm}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Saldo atual</span>
                <input
                  type="number"
                  step="0.01"
                  value={budgetDraft}
                  onChange={(event) => setBudgetDraft(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            {budgetError && <p className="mt-4 text-sm font-medium text-danger">{budgetError}</p>}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSaveBudget}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Salvar saldo atual
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Visão Financeira do Escopo Atual</h2>
                <p className="mt-1 text-sm text-gray-500">
                  O status operacional acompanha o agendamento e o Kanban automaticamente.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                <p className="text-sm font-medium text-gray-500">Agendamentos no escopo</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{scopedSchedules.length}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                <p className="text-sm font-medium text-gray-500">Atividades em andamento</p>
                <p className="mt-2 text-3xl font-bold text-blue-700">{metrics.inProgressCount}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                <p className="text-sm font-medium text-gray-500">Atividades finalizadas</p>
                <p className="mt-2 text-3xl font-bold text-green-700">{metrics.completedCount}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Sempre que uma atividade vinculada ao lançamento financeiro for movida para <span className="font-semibold">Concluído</span>,
              o custo total da atividade é abatido do saldo atual do orçamento.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Leitura Executiva</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between gap-3">
                <span>Margem consolidada</span>
                <span className={`font-semibold ${metrics.totalMargin >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(metrics.totalMargin)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Gap entre previsto e faturado</span>
                <span className="font-semibold">
                  {formatCurrency(metrics.totalPlannedRevenue - metrics.totalBilled)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Receita ainda não recebida</span>
                <span className="font-semibold">{formatCurrency(metrics.pendingToReceive)}</span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-500">
              Use este módulo para registrar os valores reais por atividade. O andamento operacional e o encerramento
              da atividade continuam sendo puxados do agendamento e do Kanban.
            </p>
          </div>
        </div>

        {isFormOpen && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Lançamento financeiro por atividade</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecione o agendamento e informe manualmente o custo da atividade. A baixa acontece automaticamente quando a atividade for concluída.
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

            {scopedSchedules.length > 0 ? (
              <>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="space-y-2 xl:col-span-3">
                    <span className="text-sm font-medium text-gray-700">Agendamento</span>
                    <select
                      value={draft.scheduleId}
                      onChange={(event) => setDraft((current) => ({ ...current, scheduleId: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Selecione</option>
                      {scopedSchedules.map((schedule) => (
                        <option key={schedule.id} value={schedule.id}>
                          {schedule.equipmentName} • {schedule.maintenanceType} • {schedule.date} às {schedule.time}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Receita prevista</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.plannedRevenue}
                      onChange={(event) => setDraft((current) => ({ ...current, plannedRevenue: Number(event.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Mão de obra</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.laborCost}
                      onChange={(event) => setDraft((current) => ({ ...current, laborCost: Number(event.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Materiais</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.materialsCost}
                      onChange={(event) => setDraft((current) => ({ ...current, materialsCost: Number(event.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Terceiros</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.outsourcedCost}
                      onChange={(event) => setDraft((current) => ({ ...current, outsourcedCost: Number(event.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Deslocamento</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.travelCost}
                      onChange={(event) => setDraft((current) => ({ ...current, travelCost: Number(event.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Outros custos</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.otherCost}
                      onChange={(event) => setDraft((current) => ({ ...current, otherCost: Number(event.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Valor faturado</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.billedAmount}
                      onChange={(event) => setDraft((current) => ({ ...current, billedAmount: Number(event.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Valor recebido</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.receivedAmount}
                      onChange={(event) => setDraft((current) => ({ ...current, receivedAmount: Number(event.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Custo da atividade</span>
                    <div className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gray-900">
                      {formatCurrency(draftActivityCost)}
                    </div>
                    <p className="text-xs text-gray-500">Baixa automática no saldo atual quando o agendamento for concluído.</p>
                  </div>
                  <label className="space-y-2 md:col-span-2 xl:col-span-3">
                    <span className="text-sm font-medium text-gray-700">Observações financeiras</span>
                    <textarea
                      rows={4}
                      value={draft.notes}
                      onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>

                {formError && <p className="mt-4 text-sm font-medium text-danger">{formError}</p>}

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    Salvar lançamento
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-medium text-gray-700">Nenhum agendamento encontrado no escopo atual.</p>
                <p className="mt-2 text-sm text-gray-500">
                  Crie primeiro uma atividade em agendamento para depois lançar os dados financeiros.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Atividades e lançamentos</h2>
              <p className="mt-1 text-sm text-gray-500">
                Cada linha acompanha automaticamente o status operacional do agendamento e do Kanban.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {rows.length > 0 ? (
              rows.map(({ schedule, entry }) => {
                const totals = entry ? calculateFinancialEntryTotals(entry) : null
                return (
                  <div key={schedule.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">{schedule.equipmentName}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getWorkflowBadge(schedule.status)}`}>
                            {schedule.status}
                          </span>
                          {entry && (
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getKanbanBadge(entry.kanbanStatus)}`}>
                              {getKanbanLabel(entry.kanbanStatus)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {schedule.clientName}
                          {schedule.siteName ? ` • ${schedule.siteName}` : ''} • {schedule.maintenanceType} • {schedule.date} às {schedule.time}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">Técnico responsável: {schedule.technician}</p>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => (entry ? openEditForm(entry) : openCreateForm(schedule.id))}
                          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          {entry ? 'Editar lançamento' : 'Lançar custo'}
                        </button>
                      )}
                    </div>

                    {entry ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-gray-500">Receita prevista</p>
                          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(entry.plannedRevenue)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-gray-500">Custo total</p>
                          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(totals?.totalCost ?? 0)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-gray-500">Faturado</p>
                          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(entry.billedAmount)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-gray-500">Recebido</p>
                          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(entry.receivedAmount)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-gray-500">Baixa no orçamento</p>
                          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(entry.budgetAppliedAmount ?? 0)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-gray-500">Saldo</p>
                          <p className={`mt-1 text-lg font-bold ${(totals?.margin ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(totals?.margin ?? 0)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-gray-700">Sem lançamento financeiro registrado para esta atividade.</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Use o botão acima para informar receita prevista, custos, faturamento e recebimento.
                        </p>
                      </div>
                    )}

                    {entry?.notes && (
                      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Observações</p>
                        <p className="mt-2 text-sm leading-6 text-gray-700">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-gray-700">Nenhuma atividade encontrada para o escopo atual.</p>
                <p className="mt-2 text-sm text-gray-500">
                  O módulo financeiro passa a refletir o cliente, site e os agendamentos em andamento automaticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
