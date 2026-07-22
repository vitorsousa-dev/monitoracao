import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PerformanceGauge } from '@/components/charts/PerformanceGauge'
import { HealthTrendChart } from '@/components/charts/HealthTrendChart'
import { UptimeChart } from '@/components/charts/UptimeChart'
import { EquipmentCard } from '@/components/equipment/EquipmentCard'
import { RankingView } from '@/components/dashboard/RankingView'
import { SiteMap } from '@/components/dashboard/SiteMap'
import { RecurringAlarms } from '@/components/alarms/RecurringAlarms'
import { useScope } from '@/hooks/useScope'
import { SERASA_SITE_ID } from '@/lib/equipmentCatalog'
import {
  mockEquipment,
  mockMonthlyEquipmentSnapshots,
  mockSites,
  mockSiteMonthlySnapshots,
  mockAlarms,
  mockPredictiveTasks
} from '@/lib/mockData'
import { Equipment, EquipmentJustification, SiteLocation, SystemRanking } from '@/types'
import { buildEquipmentJustification, buildFinancialHealthMetrics, getHealthStatusColor, getHealthStatusText } from '@/lib/utils'
import { westCorpAlarms, westCorpMonthlyEquipmentSnapshots, westCorpMonthlySummaries, westCorpSiteMonthlySnapshots } from '@/lib/westCorpOperationalData'
import { WEST_CORP_SITE_ID } from '@/lib/westCorpData'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Minus, Printer } from 'lucide-react'

type PdfColor = [number, number, number]

interface PdfTextBlock {
  kind: 'text'
  text: string
  x: number
  y: number
  size?: number
  color?: PdfColor
  bold?: boolean
}

interface PdfRectBlock {
  kind: 'rect'
  x: number
  y: number
  width: number
  height: number
  fillColor?: PdfColor
  strokeColor?: PdfColor
  lineWidth?: number
}

type PdfBlock = PdfTextBlock | PdfRectBlock

function sanitizePdfText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function wrapPdfText(text: string, maxLength = 88) {
  if (text.length <= maxLength) {
    return [text]
  }

  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (nextLine.length > maxLength) {
      if (currentLine) {
        lines.push(currentLine)
      }
      currentLine = word
      return
    }

    currentLine = nextLine
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function sanitizeFilename(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function pdfColor(color: PdfColor) {
  return color.map((value) => (value / 255).toFixed(3)).join(' ')
}

function buildPdfBlob(pages: PdfBlock[][]) {
  const pageWidth = 612
  const pageHeight = 792
  const pageStreams = pages.map((blocks) =>
    blocks
      .map((block) => {
        if (block.kind === 'rect') {
          const parts = ['q']
          if (block.lineWidth) {
            parts.push(`${block.lineWidth} w`)
          }
          if (block.fillColor) {
            parts.push(`${pdfColor(block.fillColor)} rg`)
          }
          if (block.strokeColor) {
            parts.push(`${pdfColor(block.strokeColor)} RG`)
          }
          parts.push(`${block.x} ${block.y} ${block.width} ${block.height} re`)
          parts.push(block.fillColor && block.strokeColor ? 'B' : block.fillColor ? 'f' : 'S')
          parts.push('Q')
          return parts.join('\n')
        }

        const fontName = block.bold ? 'F2' : 'F1'
        const color = block.color ?? [31, 41, 55]
        return `BT ${pdfColor(color)} rg /${fontName} ${block.size ?? 11} Tf 1 0 0 1 ${block.x} ${block.y} Tm (${sanitizePdfText(block.text)}) Tj ET`
      })
      .join('\n')
  )

  const objects: string[] = []
  const pageObjectNumbers: number[] = []

  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push('')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')

  pageStreams.forEach((stream) => {
    const pageObjectNumber = objects.length + 1
    const contentObjectNumber = objects.length + 2

    pageObjectNumbers.push(pageObjectNumber)
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    )
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((pageNumber) => `${pageNumber} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  objects.forEach((objectContent, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${objectContent}\nendobj\n`
  })

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
  })

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

function addWrappedText(
  blocks: PdfBlock[],
  text: string,
  x: number,
  y: number,
  options?: {
    size?: number
    color?: PdfColor
    bold?: boolean
    maxLength?: number
    lineGap?: number
  }
) {
  const lines = wrapPdfText(text, options?.maxLength ?? 50)
  const size = options?.size ?? 11
  const lineGap = options?.lineGap ?? 4

  lines.forEach((line, index) => {
    blocks.push({
      kind: 'text',
      text: line,
      x,
      y: y - index * (size + lineGap),
      size,
      color: options?.color,
      bold: options?.bold,
    })
  })

  return lines.length
}

function getWrappedTextHeight(
  text: string,
  options?: {
    size?: number
    maxLength?: number
    lineGap?: number
  }
) {
  const lines = wrapPdfText(text, options?.maxLength ?? 50)
  const size = options?.size ?? 11
  const lineGap = options?.lineGap ?? 4

  return lines.length * size + Math.max(0, lines.length - 1) * lineGap
}

function getStatusPalette(status: Equipment['status']) {
  if (status === 'Vermelho') {
    return {
      fill: [254, 242, 242] as PdfColor,
      stroke: [248, 113, 113] as PdfColor,
      text: [185, 28, 28] as PdfColor,
    }
  }

  if (status === 'Amarelo') {
    return {
      fill: [255, 251, 235] as PdfColor,
      stroke: [250, 204, 21] as PdfColor,
      text: [161, 98, 7] as PdfColor,
    }
  }

  return {
    fill: [240, 253, 244] as PdfColor,
    stroke: [74, 222, 128] as PdfColor,
    text: [21, 128, 61] as PdfColor,
  }
}

function getEquipmentSiteId(equipment: { client: string; siteId?: string }) {
  return equipment.siteId ?? (equipment.client === 'Serasa Experian' ? SERASA_SITE_ID : undefined)
}

export function Dashboard() {
  const { selectedClient, selectedSite, availableClients, availableSites } = useScope()
  const allEquipmentSnapshots = useMemo(
    () => [
      ...mockMonthlyEquipmentSnapshots.map((snapshot) => ({
        ...snapshot,
        siteId: snapshot.siteId ?? 'serasa-pdc',
      })),
      ...westCorpMonthlyEquipmentSnapshots,
    ],
    []
  )
  const allSiteSnapshots = useMemo(
    () => [
      ...mockSiteMonthlySnapshots.filter((snapshot) => snapshot.siteId !== WEST_CORP_SITE_ID),
      ...westCorpSiteMonthlySnapshots,
    ],
    []
  )
  const allCurrentSites = useMemo(() => {
    const sortedWestSnapshots = [...westCorpSiteMonthlySnapshots].sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    const latestWestSnapshot = sortedWestSnapshots[sortedWestSnapshots.length - 1]
    return mockSites.map((site) => (site.siteId === WEST_CORP_SITE_ID && latestWestSnapshot ? latestWestSnapshot : site))
  }, [])
  const allAlarms = useMemo(() => [...mockAlarms, ...westCorpAlarms], [])
  const allScopedSummaries = useMemo(() => {
    const grouped = new Map<string, typeof allEquipmentSnapshots>()

    allEquipmentSnapshots.forEach((snapshot) => {
      const matchesClient = selectedClient === 'all-clients' || snapshot.client === selectedClient
      const matchesSite = selectedSite === 'all-sites' || snapshot.siteId === selectedSite

      if (!matchesClient || !matchesSite) {
        return
      }

      const current = grouped.get(snapshot.monthKey) ?? []
      current.push(snapshot)
      grouped.set(snapshot.monthKey, current)
    })

    return Array.from(grouped.entries())
      .map(([monthKey, snapshots]) => {
        const count = snapshots.length || 1
        const sortedSnapshots = [...snapshots].sort((a, b) => a.startDate.localeCompare(b.startDate))
        return {
          monthKey,
          month: sortedSnapshots[0]?.month ?? westCorpMonthlySummaries.find((summary) => summary.monthKey === monthKey)?.month ?? monthKey,
          startDate: sortedSnapshots[0]?.startDate ?? `${monthKey}-01`,
          endDate: sortedSnapshots[sortedSnapshots.length - 1]?.endDate ?? `${monthKey}-30`,
          health: Number((sortedSnapshots.reduce((sum, item) => sum + item.health, 0) / count).toFixed(2)),
          target: 90,
          availability: Number((sortedSnapshots.reduce((sum, item) => sum + item.availability, 0) / count).toFixed(2)),
          mttr: Number((sortedSnapshots.reduce((sum, item) => sum + item.mttr, 0) / count).toFixed(2)),
          totalOccurrences: sortedSnapshots.reduce((sum, item) => sum + item.totalOccurrences, 0),
          affectedEquipment: sortedSnapshots.filter((item) => item.totalOccurrences > 0).length,
        }
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }, [allEquipmentSnapshots, selectedClient, selectedSite])
  const availableMonths = allScopedSummaries
  const [startMonth, setStartMonth] = useState(availableMonths[0]?.monthKey ?? '')
  const [endMonth, setEndMonth] = useState(availableMonths[availableMonths.length - 1]?.monthKey ?? '')
  const [showMttrDetails, setShowMttrDetails] = useState(false)
  const [showFinancialDetails, setShowFinancialDetails] = useState(false)

  useEffect(() => {
    if (availableMonths.length === 0) {
      setStartMonth('')
      setEndMonth('')
      return
    }

    const firstMonth = availableMonths[0].monthKey
    const lastMonth = availableMonths[availableMonths.length - 1].monthKey

    setStartMonth((current) => (availableMonths.some((summary) => summary.monthKey === current) ? current : firstMonth))
    setEndMonth((current) => (availableMonths.some((summary) => summary.monthKey === current) ? current : lastMonth))
  }, [availableMonths])

  const selectedSummaries = useMemo(() => {
    if (!startMonth || !endMonth) {
      return []
    }

    const [from, to] = startMonth <= endMonth ? [startMonth, endMonth] : [endMonth, startMonth]
    return allScopedSummaries.filter((summary) => summary.monthKey >= from && summary.monthKey <= to)
  }, [allScopedSummaries, endMonth, startMonth])

  const selectedSnapshots = useMemo(() => {
    if (selectedSummaries.length === 0) {
      return []
    }

    const monthKeys = new Set(selectedSummaries.map((summary) => summary.monthKey))
    return allEquipmentSnapshots.filter((snapshot) => {
      const matchesMonth = monthKeys.has(snapshot.monthKey)
      const matchesClient = selectedClient === 'all-clients' || snapshot.client === selectedClient
      const matchesSite = selectedSite === 'all-sites' || snapshot.siteId === selectedSite
      return matchesMonth && matchesClient && matchesSite
    })
  }, [allEquipmentSnapshots, selectedClient, selectedSite, selectedSummaries])

  const aggregatedEquipment = useMemo(() => {
    const equipmentMap = new Map<string, Equipment & { _count: number }>()
    const relevantSnapshots = selectedSnapshots.filter((snapshot) => snapshot.totalOccurrences > 0)

    relevantSnapshots.forEach((snapshot) => {
      const current = equipmentMap.get(snapshot.id)
      if (!current) {
        equipmentMap.set(snapshot.id, {
          ...snapshot,
          health: snapshot.health,
          availability: snapshot.availability,
          comfort: snapshot.comfort,
          performance: snapshot.performance,
          mttr: snapshot.mttr,
          totalOccurrences: snapshot.totalOccurrences,
          criticalOccurrences: snapshot.criticalOccurrences,
          moderateOccurrences: snapshot.moderateOccurrences,
          informativeOccurrences: snapshot.informativeOccurrences,
          lastUpdated: snapshot.endDate,
          _count: 1,
        })
        return
      }

      current.health += snapshot.health
      current.availability += snapshot.availability
      current.comfort += snapshot.comfort
      current.performance += snapshot.performance
      current.mttr += snapshot.mttr
      current.totalOccurrences += snapshot.totalOccurrences
      current.criticalOccurrences += snapshot.criticalOccurrences
      current.moderateOccurrences += snapshot.moderateOccurrences
      current.informativeOccurrences += snapshot.informativeOccurrences
      current.lastUpdated = snapshot.endDate
      current._count += 1
      equipmentMap.set(snapshot.id, current)
    })

    return Array.from(equipmentMap.values())
      .map(({ _count, ...equipment }) => ({
        ...equipment,
        health: Number((equipment.health / _count).toFixed(2)),
        availability: Number((equipment.availability / _count).toFixed(2)),
        comfort: Number((equipment.comfort / _count).toFixed(2)),
        performance: Number((equipment.performance / _count).toFixed(2)),
        mttr: Number((equipment.mttr / _count).toFixed(2)),
        status: getHealthStatusText(equipment.health / _count) as Equipment['status'],
      }))
      .sort((a, b) => b.totalOccurrences - a.totalOccurrences || a.health - b.health)
  }, [selectedSnapshots])

  const dashboardMetrics = useMemo(() => {
    if (selectedSummaries.length === 0) {
      return {
        averageHealth: 0,
        averageAvailability: 0,
        mttr: 0,
        totalOccurrences: 0,
        affectedEquipment: 0,
      }
    }

    const count = selectedSummaries.length
    return {
      averageHealth: Number((selectedSummaries.reduce((sum, item) => sum + item.health, 0) / count).toFixed(2)),
      averageAvailability: Number((selectedSummaries.reduce((sum, item) => sum + item.availability, 0) / count).toFixed(2)),
      mttr: Number((selectedSummaries.reduce((sum, item) => sum + item.mttr, 0) / count).toFixed(2)),
      totalOccurrences: selectedSummaries.reduce((sum, item) => sum + item.totalOccurrences, 0),
      affectedEquipment: aggregatedEquipment.length,
    }
  }, [selectedSummaries, aggregatedEquipment.length])

  const rankingData = useMemo<SystemRanking[]>(() => {
    return aggregatedEquipment.map((equipment, index) => ({
      id: equipment.id,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      clientName: equipment.client,
      systemName: `${equipment.area} • ${equipment.name}`,
      totalAlarms: equipment.totalOccurrences,
      criticalAlarms: equipment.criticalOccurrences,
      healthScore: equipment.health,
      availability: equipment.availability,
      rank: index + 1,
      trend: index === 0 ? 'down' : index === 1 ? 'stable' : 'up',
    }))
  }, [aggregatedEquipment])

  const filteredAlarms = useMemo(() => {
    if (selectedSummaries.length === 0) {
      return []
    }

    const monthKeys = new Set(selectedSummaries.map((summary) => summary.monthKey))
    const relevantEquipmentIds = new Set(selectedSnapshots.map((snapshot) => snapshot.id))

    return allAlarms.filter((alarm) => {
      const matchesMonth = monthKeys.has(alarm.createdAt.slice(0, 7))
      const matchesClient = selectedClient === 'all-clients' || alarm.clientName === selectedClient
      const matchesSite = selectedSite === 'all-sites' || relevantEquipmentIds.has(alarm.equipmentId)
      return matchesMonth && matchesClient && matchesSite
    })
  }, [allAlarms, selectedClient, selectedSite, selectedSnapshots, selectedSummaries])

  const filteredPredictiveTasks = useMemo(() => {
    const relevantEquipmentIds = new Set([
      ...aggregatedEquipment.map((equipment) => equipment.id),
      ...filteredAlarms.map((alarm) => alarm.equipmentId),
    ])

    if (relevantEquipmentIds.size === 0) {
      return []
    }

    return mockPredictiveTasks.filter((task) => relevantEquipmentIds.has(task.equipmentId))
  }, [aggregatedEquipment, filteredAlarms])

  const siteSummaries = useMemo<SiteLocation[]>(() => {
    if (allCurrentSites.length === 0) {
      return []
    }

    if (selectedSummaries.length === 0) {
      return allCurrentSites.filter((site) => {
        const matchesClient = selectedClient === 'all-clients' || site.cliente === selectedClient
        const matchesSite = selectedSite === 'all-sites' || site.siteId === selectedSite
        return matchesClient && matchesSite
      })
    }

    const monthKeys = new Set(selectedSummaries.map((summary) => summary.monthKey))
    const scopedSiteSnapshots = allSiteSnapshots.filter((snapshot) => {
      const matchesMonth = monthKeys.has(snapshot.monthKey)
      const matchesClient = selectedClient === 'all-clients' || snapshot.cliente === selectedClient
      const matchesSite = selectedSite === 'all-sites' || snapshot.siteId === selectedSite
      return matchesMonth && matchesClient && matchesSite
    })

    if (scopedSiteSnapshots.length === 0) {
      return allCurrentSites
    }

    const groupedSites = new Map<string, SiteLocation & { _count: number }>()

    scopedSiteSnapshots.forEach((snapshot) => {
      const current = groupedSites.get(snapshot.siteId)

      if (!current) {
        groupedSites.set(snapshot.siteId, {
          ...snapshot,
          _count: 1,
        })
        return
      }

      current.saudeGeral += snapshot.saudeGeral
      current.disponibilidade += snapshot.disponibilidade
      current.conforto += snapshot.conforto
      current.performance += snapshot.performance
      current.ocorrenciasCriticas += snapshot.ocorrenciasCriticas
      current.ultimaAtualizacao = snapshot.ultimaAtualizacao
      current._count += 1
      groupedSites.set(snapshot.siteId, current)
    })

    return Array.from(groupedSites.values()).map(({ _count, ...site }) => ({
      ...site,
      saudeGeral: Number((site.saudeGeral / _count).toFixed(2)),
      disponibilidade: Number((site.disponibilidade / _count).toFixed(2)),
      conforto: Number((site.conforto / _count).toFixed(2)),
      performance: Number((site.performance / _count).toFixed(2)),
      ocorrenciasCriticas: Number((site.ocorrenciasCriticas / _count).toFixed(0)),
    }))
  }, [allCurrentSites, allSiteSnapshots, selectedClient, selectedSite, selectedSummaries])

  const visibleSiteSummaries = siteSummaries

  const highlightedEquipment = useMemo(
    () =>
      (
        aggregatedEquipment.length > 0
          ? aggregatedEquipment
          : mockEquipment.filter((equipment) => {
              const matchesClient = selectedClient === 'all-clients' || equipment.client === selectedClient
              const matchesSite = selectedSite === 'all-sites' || getEquipmentSiteId(equipment) === selectedSite
              return matchesClient && matchesSite
            })
      ).slice(0, 3),
    [aggregatedEquipment, selectedClient, selectedSite]
  )

  const equipmentJustifications = useMemo(() => {
    const entries: Array<[string, EquipmentJustification]> = highlightedEquipment.map((equipment) => [
      equipment.id,
      buildEquipmentJustification(equipment, filteredAlarms, filteredPredictiveTasks),
    ])

    return new Map<string, EquipmentJustification>(entries)
  }, [filteredAlarms, filteredPredictiveTasks, highlightedEquipment])

  const financialMetrics = useMemo(
    () => buildFinancialHealthMetrics(
      filteredAlarms,
      filteredPredictiveTasks,
      dashboardMetrics.averageHealth,
      dashboardMetrics.averageAvailability
    ),
    [dashboardMetrics.averageAvailability, dashboardMetrics.averageHealth, filteredAlarms, filteredPredictiveTasks]
  )

  const currentSummary = selectedSummaries[selectedSummaries.length - 1]
  const currentSummaryIndex = currentSummary
    ? allScopedSummaries.findIndex((summary) => summary.monthKey === currentSummary.monthKey)
    : -1
  const previousSummary = currentSummaryIndex > 0 ? allScopedSummaries[currentSummaryIndex - 1] : null

  const availabilityDelta = previousSummary ? Number((currentSummary.availability - previousSummary.availability).toFixed(2)) : 0
  const mttrDelta = previousSummary ? Number((currentSummary.mttr - previousSummary.mttr).toFixed(2)) : 0
  const selectedPeriodLabel = selectedSummaries.length > 0
    ? `${selectedSummaries[0].month} a ${selectedSummaries[selectedSummaries.length - 1].month}`
    : 'Periodo sem dados'
  const selectedClientLabel =
    selectedClient === 'all-clients'
      ? 'Todos os clientes'
      : availableClients.find((client) => client.id === selectedClient)?.label ?? selectedClient
  const selectedSiteLabel =
    selectedSite === 'all-sites'
      ? 'Todos os sites'
      : availableSites.find((site) => site.id === selectedSite)?.label ?? selectedSite
  const reportScopeTitle = selectedSite !== 'all-sites' ? selectedSiteLabel : selectedClientLabel
  const reportScopeDescription =
    selectedSite !== 'all-sites'
      ? `Cliente: ${selectedClientLabel} | Site: ${selectedSiteLabel}`
      : selectedClient === 'all-clients'
        ? 'Escopo: visão consolidada de todos os clientes e sites'
        : `Cliente: ${selectedClientLabel} | Site: todos os sites`
  const reportGeneratedLabel = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())

  const renderTrend = (delta: number, reverseGood = false) => {
    if (delta === 0) {
      return (
        <div className="flex items-center text-gray-500">
          <Minus className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Sem base anterior</span>
        </div>
      )
    }

    const isPositive = delta > 0
    const positiveIsGood = reverseGood ? !isPositive : isPositive
    const Icon = isPositive ? TrendingUp : TrendingDown
    const color = positiveIsGood ? 'text-success' : 'text-danger'
    const signal = delta > 0 ? '+' : ''

    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">{signal}{delta}{reverseGood ? 'h' : '%'}</span>
      </div>
    )
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value)

  const handleExportOverviewPdf = () => {
    const followupAlarms = filteredAlarms
      .filter((alarm) => alarm.status === 'pending_followup')
      .slice(0, 8)

    const pageOne: PdfBlock[] = []
    const detailPages: PdfBlock[][] = []

    const createEquipmentPage = () => {
      const page: PdfBlock[] = [
        { kind: 'rect', x: 0, y: 720, width: 612, height: 72, fillColor: [80, 32, 68] },
        { kind: 'text', text: `Justificativas - ${reportScopeTitle}`, x: 44, y: 752, size: 20, color: [255, 255, 255], bold: true },
        { kind: 'text', text: `Principais evidencias do escopo ${reportScopeDescription}`, x: 44, y: 730, size: 11, color: [243, 244, 246] },
      ]

      detailPages.push(page)
      return page
    }

    pageOne.push(
      { kind: 'rect', x: 0, y: 682, width: 612, height: 110, fillColor: [80, 32, 68] },
      { kind: 'rect', x: 0, y: 665, width: 612, height: 18, fillColor: [166, 48, 86] },
      { kind: 'text', text: 'EMS | Relatorio Gerencial', x: 44, y: 742, size: 22, color: [255, 255, 255], bold: true },
      { kind: 'text', text: `Relatorio executivo automatico - ${reportScopeTitle}`, x: 44, y: 718, size: 12, color: [243, 244, 246] },
      { kind: 'text', text: `Periodo analisado: ${selectedPeriodLabel}`, x: 390, y: 742, size: 11, color: [255, 255, 255], bold: true },
      { kind: 'text', text: reportScopeDescription, x: 44, y: 698, size: 10, color: [229, 231, 235] },
      { kind: 'text', text: `Gerado em ${reportGeneratedLabel}`, x: 390, y: 720, size: 10, color: [229, 231, 235] }
    )

      const kpiCards = [
        { label: 'Saude Geral', value: `${dashboardMetrics.averageHealth}%`, note: 'Equipamentos com ocorrencias', x: 44, y: 560 },
        { label: 'Disponibilidade', value: `${dashboardMetrics.averageAvailability}%`, note: 'Media operacional do periodo', x: 314, y: 560 },
        { label: 'MTTR', value: `${dashboardMetrics.mttr}h`, note: 'Tempo medio de resolucao', x: 44, y: 455 },
        { label: 'Ocorrencias', value: `${dashboardMetrics.totalOccurrences}`, note: `${dashboardMetrics.affectedEquipment} equipamentos impactados`, x: 314, y: 455 },
      ]

      kpiCards.forEach((card) => {
        pageOne.push(
          { kind: 'rect', x: card.x, y: card.y, width: 254, height: 86, fillColor: [255, 255, 255], strokeColor: [226, 232, 240], lineWidth: 1 },
          { kind: 'rect', x: card.x, y: card.y + 72, width: 254, height: 14, fillColor: [248, 250, 252] },
          { kind: 'text', text: card.label, x: card.x + 16, y: card.y + 56, size: 10, color: [100, 116, 139], bold: true },
          { kind: 'text', text: card.value, x: card.x + 16, y: card.y + 28, size: 24, color: [15, 23, 42], bold: true },
          { kind: 'text', text: card.note, x: card.x + 16, y: card.y + 12, size: 9, color: [100, 116, 139] }
        )
      })

      pageOne.push(
        { kind: 'text', text: `Ranking de Alarmes - ${reportScopeTitle}`, x: 44, y: 408, size: 16, color: [15, 23, 42], bold: true },
        { kind: 'rect', x: 44, y: 150, width: 524, height: 236, fillColor: [255, 255, 255], strokeColor: [226, 232, 240], lineWidth: 1 },
        { kind: 'rect', x: 44, y: 354, width: 524, height: 32, fillColor: [248, 250, 252] }
      )

      const tableHeaders = [
        { text: 'Pos.', x: 58 },
        { text: 'Equipamento', x: 100 },
        { text: 'Alarmes', x: 340 },
        { text: 'Criticos', x: 420 },
        { text: 'Saude', x: 500 },
      ]

      tableHeaders.forEach((header) => {
        pageOne.push({ kind: 'text', text: header.text, x: header.x, y: 366, size: 10, color: [71, 85, 105], bold: true })
      })

      rankingData.slice(0, 5).forEach((item, index) => {
        const rowY = 330 - index * 36
        pageOne.push({ kind: 'rect', x: 44, y: rowY - 10, width: 524, height: 1, fillColor: [241, 245, 249] })
        pageOne.push({ kind: 'text', text: String(item.rank), x: 62, y: rowY + 8, size: 10, color: [15, 23, 42], bold: true })
        addWrappedText(pageOne, item.equipmentName ?? item.systemName, 100, rowY + 8, { size: 10, color: [15, 23, 42], bold: index === 0, maxLength: 28, lineGap: 2 })
        pageOne.push(
          { kind: 'text', text: String(item.totalAlarms), x: 352, y: rowY + 8, size: 10, color: [15, 23, 42] },
          { kind: 'text', text: String(item.criticalAlarms), x: 435, y: rowY + 8, size: 10, color: [185, 28, 28], bold: item.criticalAlarms > 0 },
          { kind: 'text', text: `${item.healthScore}%`, x: 500, y: rowY + 8, size: 10, color: [15, 23, 42] }
        )
      })

      pageOne.push(
        { kind: 'text', text: 'Resumo Executivo', x: 44, y: 122, size: 16, color: [15, 23, 42], bold: true },
        { kind: 'rect', x: 44, y: 46, width: 524, height: 58, fillColor: [248, 250, 252], strokeColor: [226, 232, 240], lineWidth: 1 }
      )
      addWrappedText(
        pageOne,
        `No periodo ${selectedPeriodLabel}, o escopo ${reportScopeDescription} consolidou ${dashboardMetrics.totalOccurrences} ocorrencias em ${dashboardMetrics.affectedEquipment} equipamentos, com saude media de ${dashboardMetrics.averageHealth}% e disponibilidade media de ${dashboardMetrics.averageAvailability}%.`,
        58,
        82,
        { size: 10, color: [51, 65, 85], maxLength: 88, lineGap: 4 }
      )

      let currentDetailPage = createEquipmentPage()
      let currentTopY = 688

      highlightedEquipment.forEach((equipment) => {
        const justification = equipmentJustifications.get(equipment.id)
        const statusPalette = getStatusPalette(equipment.status)

        const metaText = `${equipment.area} | Saude ${equipment.health}% | Disponibilidade ${equipment.availability}% | MTTR ${equipment.mttr.toFixed(1)}h | Ocorrencias ${equipment.totalOccurrences}`
        const metaHeight = getWrappedTextHeight(metaText, { size: 10, maxLength: 78, lineGap: 3 })
        const summaryText = justification?.summary ?? 'Sem justificativa disponivel.'
        const summaryHeight = getWrappedTextHeight(summaryText, { size: 11, maxLength: 76, lineGap: 4 })
        const detailHeights = (justification?.details ?? []).slice(0, 3).map((detail) =>
          getWrappedTextHeight(`- ${detail}`, { size: 10, maxLength: 74, lineGap: 2 })
        )
        const detailsHeight = detailHeights.reduce((total, height) => total + height, 0)
        const detailSpacing = Math.max(0, detailHeights.length - 1) * 8
        const cardHeight = 30 + metaHeight + 14 + summaryHeight + 12 + detailsHeight + detailSpacing + 18

        if (currentTopY - cardHeight < 130) {
          currentDetailPage = createEquipmentPage()
          currentTopY = 688
        }

        const cardY = currentTopY - cardHeight

        currentDetailPage.push(
          { kind: 'rect', x: 44, y: cardY, width: 524, height: cardHeight, fillColor: [255, 255, 255], strokeColor: [226, 232, 240], lineWidth: 1 },
          { kind: 'text', text: equipment.name, x: 60, y: currentTopY - 26, size: 15, color: [15, 23, 42], bold: true },
          { kind: 'rect', x: 455, y: currentTopY - 38, width: 95, height: 22, fillColor: statusPalette.fill, strokeColor: statusPalette.stroke, lineWidth: 1 },
          { kind: 'text', text: equipment.status, x: 482, y: currentTopY - 31, size: 10, color: statusPalette.text, bold: true }
        )

        let contentY = currentTopY - 52
        addWrappedText(currentDetailPage, metaText, 60, contentY, {
          size: 10,
          color: [100, 116, 139],
          maxLength: 78,
          lineGap: 3,
        })
        contentY -= metaHeight + 14

        addWrappedText(currentDetailPage, summaryText, 60, contentY, {
          size: 11,
          color: [31, 41, 55],
          bold: true,
          maxLength: 76,
          lineGap: 4,
        })
        contentY -= summaryHeight + 12

        ;(justification?.details ?? []).slice(0, 3).forEach((detail) => {
          const detailText = `- ${detail}`
          const detailHeight = getWrappedTextHeight(detailText, { size: 10, maxLength: 74, lineGap: 2 })
          addWrappedText(currentDetailPage, detailText, 72, contentY, {
            size: 10,
            color: [71, 85, 105],
            maxLength: 74,
            lineGap: 2,
          })
          contentY -= detailHeight + 8
        })

        currentTopY = cardY - 24
      })

      const pageThree: PdfBlock[] = [
        { kind: 'rect', x: 0, y: 720, width: 612, height: 72, fillColor: [80, 32, 68] },
        { kind: 'text', text: `Complementos - ${reportScopeTitle}`, x: 44, y: 752, size: 20, color: [255, 255, 255], bold: true },
        { kind: 'text', text: `Analises preditivas e follow-up do periodo ${selectedPeriodLabel}`, x: 44, y: 730, size: 11, color: [243, 244, 246] },
        { kind: 'text', text: 'Analises Preditivas', x: 44, y: 660, size: 16, color: [15, 23, 42], bold: true },
        { kind: 'rect', x: 44, y: 382, width: 252, height: 250, fillColor: [255, 255, 255], strokeColor: [226, 232, 240], lineWidth: 1 },
        { kind: 'text', text: 'Alarmes com Follow-up', x: 316, y: 660, size: 16, color: [15, 23, 42], bold: true },
        { kind: 'rect', x: 316, y: 382, width: 252, height: 250, fillColor: [255, 255, 255], strokeColor: [226, 232, 240], lineWidth: 1 },
      ]

      if (filteredPredictiveTasks.length === 0) {
        addWrappedText(pageThree, 'Sem analises preditivas registradas.', 58, 606, {
          size: 10,
          color: [71, 85, 105],
          maxLength: 34,
          lineGap: 3,
        })
      } else {
        let predictiveY = 606
        filteredPredictiveTasks.slice(0, 3).forEach((task) => {
          const predictiveText = `${task.equipmentName}: ${task.technicalAnalysis}`
          const predictiveHeight = getWrappedTextHeight(predictiveText, { size: 10, maxLength: 34, lineGap: 3 })

          addWrappedText(pageThree, predictiveText, 58, predictiveY, {
            size: 10,
            color: [71, 85, 105],
            maxLength: 34,
            lineGap: 3,
          })
          predictiveY -= predictiveHeight + 16
        })
      }

      if (followupAlarms.length === 0) {
        addWrappedText(pageThree, 'Nenhum follow-up pendente no periodo.', 330, 606, {
          size: 10,
          color: [71, 85, 105],
          maxLength: 34,
          lineGap: 3,
        })
      } else {
        let followupY = 606
        followupAlarms.slice(0, 3).forEach((alarm) => {
          const followupText = `${alarm.equipmentName}: ${alarm.message}`
          const followupHeight = getWrappedTextHeight(followupText, { size: 10, maxLength: 34, lineGap: 3 })

          addWrappedText(pageThree, followupText, 330, followupY, {
            size: 10,
            color: [71, 85, 105],
            maxLength: 34,
            lineGap: 3,
          })
          followupY -= followupHeight + 16
        })
      }

      pageThree.push(
        { kind: 'text', text: `Documento gerado automaticamente a partir do dashboard EMS para ${reportScopeDescription}.`, x: 44, y: 88, size: 10, color: [100, 116, 139] }
      )

    const pdfBlob = buildPdfBlob([pageOne, ...detailPages, pageThree])
    const fileName = `ems-relatorio-${sanitizeFilename(reportScopeTitle)}-${sanitizeFilename(selectedPeriodLabel || 'periodo')}.pdf`
    const downloadUrl = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Visão consolidada dos sistemas e unidades com ocorrência no período</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Período de análise</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div>
                <label className="block text-xs text-gray-500 mb-1">De</label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full min-w-[140px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {availableMonths.map((summary) => (
                    <option key={`start-${summary.monthKey}`} value={summary.monthKey}>
                      {summary.month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Até</label>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full min-w-[140px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {availableMonths.map((summary) => (
                    <option key={`end-${summary.monthKey}`} value={summary.monthKey}>
                      {summary.month}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleExportOverviewPdf}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Exportar PDF do escopo atual
            </button>
            {currentSummary && (
              <p className="mt-3 text-xs text-gray-500">
                Dados disponíveis de {selectedSummaries[0]?.startDate} até {currentSummary.endDate}
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <PerformanceGauge
            value={dashboardMetrics.averageHealth}
            title="Saúde Geral"
            subtitle="Equipamentos com ocorrências no período"
          />
          
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900">Disponibilidade</h3>
              {renderTrend(availabilityDelta)}
            </div>
            <p className="mb-1 text-[2.2rem] font-bold leading-none text-primary">{dashboardMetrics.averageAvailability}%</p>
            <p className="text-sm leading-6 text-gray-500">Média dos equipamentos impactados</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900">MTTR</h3>
              {renderTrend(mttrDelta, true)}
            </div>
            <p className="mb-1 text-[2.2rem] font-bold leading-none text-gray-900">{dashboardMetrics.mttr}h</p>
            <p className="text-sm leading-6 text-gray-500">Tempo médio de resolução no período</p>
            <button
              type="button"
              onClick={() => setShowMttrDetails((current) => !current)}
              className="mt-3 inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              {showMttrDetails ? 'Ocultar detalhes' : 'Mais detalhes'}
            </button>
            {showMttrDetails && (
              <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Detalhes do indicador</p>
                <p className="mt-2 text-sm text-gray-700">
                  O MTTR representa o tempo médio necessário para tratar e normalizar uma ocorrência, desde a abertura do alarme
                  até a sua estabilização operacional.
                </p>
                <p className="mt-2 text-xs leading-5 text-gray-600">
                  A medição considera o volume de eventos no período selecionado e o esforço médio estimado de resolução por
                  equipamento impactado.
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900">Ocorrências</h3>
              <div className="flex items-center text-danger">
                <AlertTriangle className="h-4 w-4 mr-1" />
              </div>
            </div>
            <p className="mb-1 text-[2.2rem] font-bold leading-none text-gray-900">{dashboardMetrics.totalOccurrences}</p>
            <p className="text-sm leading-6 text-gray-500">{dashboardMetrics.affectedEquipment} equipamentos impactados</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900">Saúde Financeira</h3>
              <span
                className="text-sm font-semibold"
                style={{ color: getHealthStatusColor(financialMetrics.score) }}
              >
                {financialMetrics.savingsRate}%
              </span>
            </div>
            <p
              className="mb-1 text-[2.2rem] font-bold leading-none"
              style={{ color: getHealthStatusColor(financialMetrics.score) }}
            >
              {financialMetrics.score}%
            </p>
            <p className="text-sm leading-6 text-gray-500">
              Custo liquido estimado de {formatCurrency(financialMetrics.netEstimatedCost)} no período
            </p>
            <button
              type="button"
              onClick={() => setShowFinancialDetails((current) => !current)}
              className="mt-3 inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              {showFinancialDetails ? 'Ocultar detalhes' : 'Mais detalhes'}
            </button>
            {showFinancialDetails && (
              <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Leitura financeira</p>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>Exposição corretiva estimada</span>
                    <span className="font-semibold">{formatCurrency(financialMetrics.correctiveExposure)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Atividades preditivas planejadas</span>
                    <span className="font-semibold">{formatCurrency(financialMetrics.predictiveInvestment)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Economia com visitas técnicas evitadas</span>
                    <span className="font-semibold text-success">{formatCurrency(financialMetrics.avoidedTechnicalVisits)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Desperdício operacional evitado</span>
                    <span className="font-semibold text-success">{formatCurrency(financialMetrics.avoidedWaste)}</span>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-600">
                  A métrica considera valores de mercado para resposta a alarmes, custo estimado das ações preditivas e a
                  economia gerada ao evitar visitas técnicas improdutivas ou manutenção sem ganho efetivo.
                </p>
              </div>
            )}
          </div>
        </div>

        <SiteMap sites={visibleSiteSummaries} periodLabel={selectedPeriodLabel} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HealthTrendChart data={selectedSummaries.map(({ month, health, target }) => ({ month, health, target }))} />
          <UptimeChart data={selectedSummaries.map(({ month, availability }) => ({ month, availability }))} />
        </div>
        
        <RankingView rankings={rankingData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Equipamentos Críticos</h2>
              <Activity className="h-5 w-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {highlightedEquipment.map(equipment => (
                <EquipmentCard
                  key={equipment.id}
                  equipment={equipment}
                  justification={equipmentJustifications.get(equipment.id)}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <RecurringAlarms alarms={filteredAlarms} />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Últimas Atualizações</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Nenhuma atualização semanal publicada até o momento.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    As novas entradas poderão ser adicionadas manualmente na área de atualizações.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
