import { validateConfig } from './security'
import { createCoolAutomationApi } from './api'
import { isCoolAutomationError, safeErrorMessage } from './errors'
import type {
  CoolAutomationConfig,
  DiagnosticResult,
  DiagnosticStep,
  CoolAutomationLs2Result,
} from './types'

function makeStep(
  name: string,
  status: DiagnosticStep['status'],
  message: string,
  extras?: Partial<DiagnosticStep>
): DiagnosticStep {
  return { name, status, message, ...extras }
}

export async function runCoolAutomationDiagnostic(
  config: CoolAutomationConfig,
  options?: { unitUid?: string }
): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    configStatus: makeStep('config', 'pending', 'Aguardando...'),
    connectivityStatus: makeStep('connectivity', 'pending', 'Aguardando...'),
    ls2QueryStatus: makeStep('ls2-query', 'pending', 'Aguardando...'),
    unitQueryStatus: makeStep('unit-query', 'pending', 'Aguardando...'),
    unitsFound: 0,
    fieldsReturned: [],
    lastTestAt: null,
    source: 'unknown',
    testedResources: [],
    hasAlarmHistory: null,
    alarmHistoryNote: null,
  }

  const { valid, missing } = validateConfig(config)
  if (!valid) {
    result.configStatus = makeStep(
      'config',
      'failed',
      `Configuração incompleta. Campos ausentes: ${missing.join(', ')}.`
    )
    result.connectivityStatus = makeStep('connectivity', 'skipped', 'Configuração incompleta — conectividade não testada.')
    result.ls2QueryStatus = makeStep('ls2-query', 'skipped', 'Configuração incompleta — consulta não executada.')
    result.unitQueryStatus = makeStep('unit-query', 'skipped', 'Configuração incompleta — consulta não executada.')
    result.lastTestAt = new Date().toISOString()
    return result
  }

  if (!config.enabled) {
    result.configStatus = makeStep(
      'config',
      'failed',
      'Integração desabilitada (COOLAUTOMATION_ENABLED=false). Habilite para executar os testes.'
    )
    result.connectivityStatus = makeStep('connectivity', 'skipped', 'Integração desabilitada.')
    result.ls2QueryStatus = makeStep('ls2-query', 'skipped', 'Integração desabilitada.')
    result.unitQueryStatus = makeStep('unit-query', 'skipped', 'Integração desabilitada.')
    result.lastTestAt = new Date().toISOString()
    return result
  }

  result.configStatus = makeStep('config', 'passed', 'Configuração válida e integração habilitada.')

  const api = createCoolAutomationApi(config)
  const testedResources: string[] = []

  // TESTE B — Conectividade HTTP (tenta listar unidades)
  const connectivityStart = Date.now()
  let ls2Result: CoolAutomationLs2Result | null = null
  try {
    ls2Result = await api.listUnits()
    const responseTimeMs = Date.now() - connectivityStart
    result.connectivityStatus = makeStep(
      'connectivity',
      'passed',
      `Dispositivo respondeu com sucesso.`,
      { responseTimeMs, httpStatus: 200 }
    )
    testedResources.push('ls2')
  } catch (err) {
    const responseTimeMs = Date.now() - connectivityStart
    const message = isCoolAutomationError(err) ? safeErrorMessage(err) : String(err)
    result.connectivityStatus = makeStep('connectivity', 'failed', message, {
      responseTimeMs,
      httpStatus: isCoolAutomationError(err) ? err.httpStatus : undefined,
    })
    result.ls2QueryStatus = makeStep('ls2-query', 'failed', message)
    result.unitQueryStatus = makeStep('unit-query', 'skipped', 'Consulta ls2 falhou — unidade individual não testada.')
    result.lastTestAt = new Date().toISOString()
    result.testedResources = testedResources
    return result
  }

  // TESTE C — Consulta de unidades (ls2)
  if (ls2Result) {
    result.ls2QueryStatus = makeStep(
      'ls2-query',
      'passed',
      `Consulta ls2 retornou ${ls2Result.units.length} unidade(s). rc=${ls2Result.rc}.`,
      { details: { command: ls2Result.command, unitCount: ls2Result.units.length } }
    )
    result.unitsFound = ls2Result.units.length
    result.fieldsReturned = ls2Result.availableFields

    const hasFaultField = ls2Result.availableFields.some((f) => f === 'fls' || f === 'flr')
    if (!hasFaultField) {
      result.ls2QueryStatus.details = {
        ...result.ls2QueryStatus.details,
        warning: 'Campo de falha (fls/flr) não encontrado na resposta.',
      }
    }
  }

  // TESTE D — Consulta individual
  const unitUid = options?.unitUid
  if (unitUid && ls2Result && ls2Result.units.length > 0) {
    const unitStart = Date.now()
    try {
      await api.getUnit(unitUid)
      result.unitQueryStatus = makeStep(
        'unit-query',
        'passed',
        `Consulta individual da unidade ${unitUid} bem-sucedida.`,
        { responseTimeMs: Date.now() - unitStart, httpStatus: 200 }
      )
      testedResources.push('ls2&uid')
    } catch (err) {
      result.unitQueryStatus = makeStep(
        'unit-query',
        'failed',
        isCoolAutomationError(err) ? safeErrorMessage(err) : String(err),
        { responseTimeMs: Date.now() - unitStart }
      )
    }
  } else {
    result.unitQueryStatus = makeStep(
      'unit-query',
      'skipped',
      'Nenhum UID de unidade fornecido para teste individual.'
    )
  }

  // Origem da conexão
  result.source = config.baseUrl.includes('coolremote') || config.baseUrl.includes('coolautomation')
    ? 'cloud-api'
    : 'local-device'

  result.testedResources = testedResources
  result.lastTestAt = new Date().toISOString()

  // Fase 5 — Histórico de alarmes (não confirmado pela documentação)
  result.hasAlarmHistory = null
  result.alarmHistoryNote =
    'A documentação fornecida descreve apenas o estado atual (ls2) e códigos de falha. ' +
    'Não foi identificado endpoint de histórico de alarmes. É necessário consultar a documentação ' +
    'do CoolRemote Cloud ou suporte CoolAutomation para confirmar a existência de histórico de eventos.'

  return result
}
