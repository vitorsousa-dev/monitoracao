import { Alarm, EquipmentMonthlySnapshot, MonthlySummary, SiteMonthlySnapshot } from '@/types'
import { WEST_CORP_CLIENT, WEST_CORP_SITE_ID, WEST_CORP_SITE_NAME, westCorpSite, westCorpSystems } from './westCorpData'
import { getHealthStatusText } from './utils'

export interface WestCorpUnitHealthRollup {
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

type WestCorpChSeverity = 'High' | 'Medium'
type WestCorpChCategory = 'Critical Outdoor' | 'Outdoor Error' | 'Indoor Error' | 'Indoor Control' | 'Sensor Alarm' | 'Communication Error'

type WestCorpChMeta = {
  severity: WestCorpChSeverity
  category: WestCorpChCategory
  shortTitle: string
  impact: string
  description: string
}

const CH_METADATA: Record<string, WestCorpChMeta> = {
  CH02: { severity: 'High', category: 'Indoor Error', shortTitle: 'Falha unidade interna (IDU)', impact: 'Pode comprometer a operacao da unidade e requer investigacao.', description: 'Falha associada a unidade interna; requer avaliacao da evaporadora, sensores, conexoes e controle.' },
  CH04: { severity: 'High', category: 'Indoor Error', shortTitle: 'Falha unidade interna (IDU)', impact: 'Pode comprometer a operacao da unidade e requer investigacao.', description: 'Falha associada a unidade interna; requer inspecao da evaporadora e circuitos associados.' },
  CH10: { severity: 'High', category: 'Indoor Error', shortTitle: 'Falha unidade interna (IDU)', impact: 'Pode comprometer a operacao da unidade e requer investigacao.', description: 'Falha associada a unidade interna; requer diagnostico da unidade e circuitos de controle.' },
  CH116: { severity: 'High', category: 'Outdoor Error', shortTitle: 'Alarme de sistema (ODU)', impact: 'Pode comprometer a operacao da unidade e requer investigacao.', description: 'Investigacao complementar de compressor/inverter e condicoes de retorno/gerenciamento de oleo.' },
  CH150: { severity: 'High', category: 'Indoor Control', shortTitle: 'Condicao operacao IDU', impact: 'Pode comprometer a operacao da unidade e requer investigacao.', description: 'Correcao com temperatura, EEV, superaquecimento e condicao frigorifica.' },
  CH151: { severity: 'High', category: 'Indoor Control', shortTitle: 'Controle frigorifico IDU', impact: 'Pode comprometer a operacao da unidade e requer investigacao.', description: 'Diagnostico de campo e correlacao com pressao, temperatura e valvulas.' },
  CH21: { severity: 'High', category: 'Critical Outdoor', shortTitle: 'Inverter / Compressor', impact: 'Pode provocar indisponibilidade da unidade externa/sistema e perda de climatizacao.', description: 'Recorrencia no caminho Inverter/Compressor. Investigar eletrica do compressor, IPM/placa e cabeamento.' },
  CH23: { severity: 'High', category: 'Critical Outdoor', shortTitle: 'Circuito eletrico DC', impact: 'Pode provocar indisponibilidade da unidade externa/sistema e perda de climatizacao.', description: 'Falha associada ao circuito eletrico/DC do sistema. Investigar circuito eletrico e inversor.' },
  CH24: { severity: 'High', category: 'Outdoor Error', shortTitle: 'Alimentacao AC', impact: 'Pode provocar indisponibilidade da unidade externa/sistema e perda de climatizacao.', description: 'Alarme registrado e correlacionado com alimentacao AC dentro da faixa analisada; causa especifica nao determinada, requer diagnostico de campo.' },
  CH26: { severity: 'High', category: 'Critical Outdoor', shortTitle: 'Lockout partida / Inverter', impact: 'Pode provocar indisponibilidade da unidade externa/sistema e perda de climatizacao.', description: 'Falha de partida/protecao do conjunto Compressor/Inverter (lockout apos 25 Hz / corrente 22,8 A).' },
  CH29: { severity: 'High', category: 'Critical Outdoor', shortTitle: 'Corrente anormal inverter', impact: 'Pode provocar indisponibilidade da unidade externa/sistema e perda de climatizacao.', description: 'Convergencia com corrente anormal do compressor inverter. Investigar compressor, IPM/inverter, circuito DC/PFC/pre-carga e sensores.' },
  CH34: { severity: 'High', category: 'Outdoor Error', shortTitle: 'Protecao de sistema', impact: 'Pode provocar indisponibilidade da unidade externa/sistema e perda de climatizacao.', description: 'Alarme de protecao do sistema; investigacao de campo e correlacao com pressoes e condicoes de operacao.' },
  CH35: { severity: 'High', category: 'Outdoor Error', shortTitle: 'Protecao de sistema', impact: 'Pode provocar indisponibilidade da unidade externa/sistema e perda de climatizacao.', description: 'Alarme de protecao do sistema; investigacao frigorifica e correlacao com pressoes, temperaturas e carga.' },
  CH42: { severity: 'Medium', category: 'Sensor Alarm', shortTitle: 'Falha sensor / controle', impact: 'Pode comprometer a operacao da unidade e requer investigacao.', description: 'Falha associada a sensor/controle; validar sensor, cabeamento e leitura no sistema.' },
  CH45: { severity: 'Medium', category: 'Sensor Alarm', shortTitle: 'Falha sensor / controle', impact: 'Pode comprometer a operacao da unidade e requer investigacao.', description: 'Falha associada a sensor/controle; validar sensor, cabeamento e leitura no sistema.' },
  CH52: { severity: 'High', category: 'Communication Error', shortTitle: 'Comunicacao / controle', impact: 'Pode comprometer a operacao da unidade e requer investigacao.', description: 'Falha de comunicacao/controle; investigar barramento de comunicacao, alimentacao e placas.' },
  CH53: { severity: 'High', category: 'Communication Error', shortTitle: 'Comunicacao entre unidades', impact: 'Pode comprometer a operacao da unidade e requer investigacao.', description: 'Falha de comunicacao entre unidades. Investigar comunicacao, alimentacao e conexoes do sistema.' },
  CH62: { severity: 'High', category: 'Outdoor Error', shortTitle: 'Termica inversor', impact: 'Pode provocar indisponibilidade da unidade externa/sistema e perda de climatizacao.', description: 'Alarme associado a condicao termica do conjunto inverter; inspecao do inversor, dissipacao e condicoes de operacao.' },
  CH77: { severity: 'High', category: 'Outdoor Error', shortTitle: 'Unidade externa (ODU)', impact: 'Pode provocar indisponibilidade da unidade externa/sistema e perda de climatizacao.', description: 'Alarme associado a unidade externa; investigar conjunto afetado e correlacao com telemetria.' },
}

type WestCorpAggregatedRow = {
  chCode: string
  equipmentName: string
  systemLabel: string
  occurrences: number
}

const RAW_AGGREGATED_ROWS: WestCorpAggregatedRow[] = [
  { chCode: 'CH02', equipmentName: 'L4.09E.0166_11P-A (09E)', systemLabel: '11P-A_4_4', occurrences: 204 },
  { chCode: 'CH62', equipmentName: '05P-C_MAIN', systemLabel: '05P-C_9', occurrences: 19 },
  { chCode: 'CH53', equipmentName: 'ODU L4.C00.0D80', systemLabel: '9P-B_C(12)V', occurrences: 17 },
  { chCode: 'CH35', equipmentName: '05P-C_MAIN', systemLabel: '05P-C_9', occurrences: 11 },
  { chCode: 'CH04', equipmentName: '08_8P-A_7F (07F)', systemLabel: '08P-A_E(14)', occurrences: 11 },
  { chCode: 'CH53', equipmentName: '06P-C_MAIN', systemLabel: '06P-C_B(11)', occurrences: 10 },
  { chCode: 'CH53', equipmentName: 'ODU L4.D00.0D80', systemLabel: '09P-D_D(13)V', occurrences: 10 },
  { chCode: 'CH150', equipmentName: '13P-C_MAIN', systemLabel: '13P-C_4_9', occurrences: 7 },
  { chCode: 'CH10', equipmentName: 'NOBREAK_4P-C (035)', systemLabel: '04P-C_7', occurrences: 6 },
  { chCode: 'CH150', equipmentName: 'COMERCIA 1_7P-C (060)', systemLabel: '07P-C_D(13)', occurrences: 5 },
  { chCode: 'CH150', equipmentName: 'COMERCIAL 2_7P-C (062)', systemLabel: '07P-C_D(13)', occurrences: 5 },
  { chCode: 'CH150', equipmentName: 'COMERCIAL 3_7P-C (064)', systemLabel: '07P-C_D(13)', occurrences: 5 },
  { chCode: 'CH150', equipmentName: 'COMERCIAL 4_7P-C (066)', systemLabel: '07P-C_D(13)', occurrences: 5 },
  { chCode: 'CH150', equipmentName: 'COMERCIAL 5_7P-C (067)', systemLabel: '07P-C_D(13)', occurrences: 5 },
  { chCode: 'CH150', equipmentName: 'COMERCIAL 6_7P-C (065)', systemLabel: '07P-C_D(13)', occurrences: 5 },
  { chCode: 'CH150', equipmentName: 'ENTRADA T.I_7P-C (063)', systemLabel: '07P-C_D(13)', occurrences: 5 },
  { chCode: 'CH150', equipmentName: 'REUNIAO_7P-C (061)', systemLabel: '07P-C_D(13)', occurrences: 5 },
  { chCode: 'CH53', equipmentName: '05P-C_MAIN', systemLabel: '05P-C_9', occurrences: 4 },
  { chCode: 'CH53', equipmentName: '09P-C_MAIN', systemLabel: '09P-C_4_1', occurrences: 4 },
  { chCode: 'CH53', equipmentName: '14P-A_MAIN', systemLabel: '14P-A_A(10)V', occurrences: 4 },
  { chCode: 'CH53', equipmentName: '01P-B_MAIN', systemLabel: '01P-B_0', occurrences: 3 },
  { chCode: 'CH150', equipmentName: '02P-D_MAIN', systemLabel: '02P-D_3', occurrences: 3 },
  { chCode: 'CH53', equipmentName: '08_6P-C (057)', systemLabel: '06P-C_B(11)', occurrences: 3 },
  { chCode: 'CH53', equipmentName: '01_6P-D (058)', systemLabel: '06P-D_1', occurrences: 3 },
  { chCode: 'CH53', equipmentName: '02_6P-D (059)', systemLabel: '06P-D_1', occurrences: 3 },
  { chCode: 'CH53', equipmentName: '03_6P-D (05A)', systemLabel: '06P-D_1', occurrences: 3 },
  { chCode: 'CH53', equipmentName: '6P-D-MAIN', systemLabel: '06P-D_1', occurrences: 3 },
  { chCode: 'CH53', equipmentName: 'L4.002.0D80_1P-B (002)', systemLabel: '01P-B_0', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.003.0D80_1P-B (003)', systemLabel: '01P-B_0', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.004.0D80_1P-B (004)', systemLabel: '01P-B_0', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.005.0D80_1P-B (005)', systemLabel: '01P-B_0', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.006.0D80_1P-B (006)', systemLabel: '01P-B_0', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.007.0D80_1P-B (007)', systemLabel: '01P-B_0', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.010.0D80_1P-B (010)', systemLabel: '01P-B_0', occurrences: 2 },
  { chCode: 'CH24', equipmentName: '05P-C_MAIN', systemLabel: '05P-C_9', occurrences: 2 },
  { chCode: 'CH53', equipmentName: '01_6P-C (050)', systemLabel: '06P-C_B(11)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: '02_6P-C (051)', systemLabel: '06P-C_B(11)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: '04_6P-C (053)', systemLabel: '06P-C_B(11)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: '07_6P-C (056)', systemLabel: '06P-C_B(11)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: '04_6P-D (05B)', systemLabel: '06P-D_1', occurrences: 2 },
  { chCode: 'CH151', equipmentName: 'COMERCIA 1_7P-C (060)', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH151', equipmentName: 'COMERCIAL 2_7P-C (062)', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH151', equipmentName: 'COMERCIAL 3_7P-C (064)', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH151', equipmentName: 'COMERCIAL 4_7P-C (066)', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH151', equipmentName: 'COMERCIAL 5_7P-C (067)', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH151', equipmentName: 'COMERCIAL 6_7P-C (065)', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH151', equipmentName: 'ENTRADA T.I_7P-C (063)', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH151', equipmentName: 'REUNIAO_7P-C (061)', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: '09P-A_MAIN', systemLabel: '09P-A_4_0', occurrences: 2 },
  { chCode: 'CH53', equipmentName: '10P-A_MAIN', systemLabel: '10P-A_4_2', occurrences: 2 },
  { chCode: 'CH53', equipmentName: '10P-C_MAIN', systemLabel: '10P-C_4_3', occurrences: 2 },
  { chCode: 'CH116', equipmentName: '11P-C_MAIN', systemLabel: '11P-C_4_5', occurrences: 2 },
  { chCode: 'CH53', equipmentName: '13P-A_MAIN', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.0C8.01669_13P-A (0C8)', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.0C9.0166_13P-A (0C9)', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.0CA.0166_13P-A (0CA)', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.0CB.0166_13P-A (0CB)', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.0CC.0166_13P-A (0CC)', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.0CD.0166_13P-A (0CD)', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.0CE.0166_13P-A (0CE)', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'L4.0CF.0166_13P-A (0CF)', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH116', equipmentName: '02P-B_MAIN', systemLabel: '02P-B_2', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '02P-C_MAIN', systemLabel: '02P-C_3', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.010_2P-C (010)', systemLabel: '02P-C_3', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.011_2P-C (011)', systemLabel: '02P-C_3', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.012_2P-C (012)', systemLabel: '02P-C_3', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.013_2P-C (013)', systemLabel: '02P-C_3', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.014_2P-C (014)', systemLabel: '02P-C_3', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.015_2P-C (015)', systemLabel: '02P-C_3', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.016_2P-C (016)', systemLabel: '02P-C_3', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.017_2P-C (017)', systemLabel: '02P-C_3', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '03P-A_MAIN', systemLabel: '03P-A_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'AUDITORIO 1_3P-A (02E)', systemLabel: '03P-A_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'AUDITORIO 2_3P-A (02F)', systemLabel: '03P-A_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'AUDITORIO 3_3P-A (02C)', systemLabel: '03P-A_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 1_3P-A (02A)', systemLabel: '03P-A_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 2_3P-A (029)', systemLabel: '03P-A_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESTOQUE_3P-A (02B)', systemLabel: '03P-A_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'RECEPCAO_3P-A (028)', systemLabel: '03P-A_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'REFEITORIO 3_3P-A (02D)', systemLabel: '03P-A_4', occurrences: 1 },
  { chCode: 'CH04', equipmentName: 'PORTO PREMIO 3_4P-A (03D)', systemLabel: '04P-A_6', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'REFEITORIO_4P-D (038)', systemLabel: '04P-D_4', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'REUNIAO_4P-D (03D)', systemLabel: '04P-D_4', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'SERASA 1_4P-D (03A)', systemLabel: '04P-D_4', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'SERASA 2_4P-D (03B)', systemLabel: '04P-D_4', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'SERASA 3_4P-D (039)', systemLabel: '04P-D_4', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'SERASA 4_4P-D (03C)', systemLabel: '04P-D_4', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'SERASA 5_4P-D (03F)', systemLabel: '04P-D_4', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'SERASA 6_4P-D (03E)', systemLabel: '04P-D_4', occurrences: 1 },
  { chCode: 'CH77', equipmentName: '05P-A_MAIN', systemLabel: '05P-A_8', occurrences: 1 },
  { chCode: 'CH34', equipmentName: '05P-C_MAIN', systemLabel: '05P-C_9', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '01-6P-A (058)', systemLabel: '06P-A_A(10)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '02-6P-A (059)', systemLabel: '06P-A_A(10)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '03-6P-A (05A)', systemLabel: '06P-A_A(10)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '04-6P-A (05B)', systemLabel: '06P-A_A(10)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '05-6P-A (05C)', systemLabel: '06P-A_A(10)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '06-6P-A (05D)', systemLabel: '06P-A_A(10)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '06P-A_MAIN', systemLabel: '06P-A_A(10)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '07-6P-A (05E)', systemLabel: '06P-A_A(10)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '08-6P-A (05F)', systemLabel: '06P-A_A(10)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '05_6P-C (054)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '06_6P-C (055)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH150', equipmentName: '6P-D-MAIN', systemLabel: '06P-D_1', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '11P-A_MAIN', systemLabel: '11P-A_4_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L4.09D.0166_11P-A (09D)', systemLabel: '11P-A_4_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L4.09E.0166_11P-A (09E)', systemLabel: '11P-A_4_4', occurrences: 1 },
  { chCode: 'CH150', equipmentName: '11P-B_MAIN', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH150', equipmentName: 'L5.090.0D80_11P-B (090)', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH150', equipmentName: 'L5.092.0D80_11P-B (092)', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH150', equipmentName: 'L5.093.0D80_11P-B (093)', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH150', equipmentName: 'L5.095.0D80_11P-B (095)', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH150', equipmentName: 'L5.097.0D80_11P-B (097)', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '12P-C_MAIN', systemLabel: '12P-C_4_7', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.0D8_14P-A (0D8)', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.0D9_14P-A (0D9)', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.0DA_14P-A (0DA)', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.0DB_14P-A (0DB)', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.0DC_14P-A (0DC)', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.0DD_14P-A (0DD)', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.0DE_14P-A (0DE)', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L6.0DF_14P-A (0DF)', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '14P-C_MAIN', systemLabel: '14P-C_4_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L4.0D0.1235_14P-C', systemLabel: '14P-C_4_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L4.0D1.1235_14P-C', systemLabel: '14P-C_4_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L4.0D2.1235_14P-C', systemLabel: '14P-C_4_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L4.0D3.1235_14P-C', systemLabel: '14P-C_4_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L4.0D4.1235_14P-C', systemLabel: '14P-C_4_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L4.0D5.1235_14P-C', systemLabel: '14P-C_4_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L4.0D6.1235_14P-C', systemLabel: '14P-C_4_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'L4.0D7.1235_14P-C', systemLabel: '14P-C_4_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '16P-C_MAIN', systemLabel: '16P-C_4_F', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'DEPOSITO_16P-C (0F5)', systemLabel: '16P-C_4_F', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'DIRETORIA_16P-C (0F0)', systemLabel: '16P-C_4_F', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 1_16P-C (0F3)', systemLabel: '16P-C_4_F', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 2_16P-C (0F2)', systemLabel: '16P-C_4_F', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 3_16P-C (0F4)', systemLabel: '16P-C_4_F', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 4_16P-C (0F1)', systemLabel: '16P-C_4_F', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 5_16P-C (0F6)', systemLabel: '16P-C_4_F', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 6_16P-C (0F7)', systemLabel: '16P-C_4_F', occurrences: 1 },
  { chCode: 'CH53', equipmentName: '16P-D_MAIN', systemLabel: '16P-D_F(15)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 2_16P-D (0FD)', systemLabel: '16P-D_F(15)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 3_16P-D (0FC)', systemLabel: '16P-D_F(15)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 4_16P-D (0BF)', systemLabel: '16P-D_F(15)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ESCRITORIO 5_16P-D (018)', systemLabel: '16P-D_F(15)', occurrences: 1 },
  { chCode: 'CH21', equipmentName: '05P-C_MAIN', systemLabel: '05P-C_9', occurrences: 79 },
  { chCode: 'CH29', equipmentName: '05P-C_MAIN', systemLabel: '05P-C_9', occurrences: 33 },
  { chCode: 'CH21', equipmentName: '11P-B_MAIN', systemLabel: '11P-B_4', occurrences: 12 },
  { chCode: 'CH21', equipmentName: '03P-D_MAIN', systemLabel: '03P-D_6', occurrences: 4 },
  { chCode: 'CH21', equipmentName: 'COMERCIA 1_7P-C (060)', systemLabel: '07P-C_D(13)', occurrences: 4 },
  { chCode: 'CH21', equipmentName: 'COMERCIAL 2_7P-C (062)', systemLabel: '07P-C_D(13)', occurrences: 4 },
  { chCode: 'CH21', equipmentName: 'COMERCIAL 3_7P-C (064)', systemLabel: '07P-C_D(13)', occurrences: 4 },
  { chCode: 'CH21', equipmentName: 'COMERCIAL 4_7P-C (066)', systemLabel: '07P-C_D(13)', occurrences: 4 },
  { chCode: 'CH21', equipmentName: 'COMERCIAL 5_7P-C (067)', systemLabel: '07P-C_D(13)', occurrences: 4 },
  { chCode: 'CH21', equipmentName: 'COMERCIAL 6_7P-C (065)', systemLabel: '07P-C_D(13)', occurrences: 4 },
  { chCode: 'CH21', equipmentName: 'ENTRADA T.I_7P-C (063)', systemLabel: '07P-C_D(13)', occurrences: 4 },
  { chCode: 'CH21', equipmentName: 'REUNIAO_7P-C (061)', systemLabel: '07P-C_D(13)', occurrences: 4 },
  { chCode: 'CH21', equipmentName: '04P-C_MAIN', systemLabel: '04P-C_7', occurrences: 3 },
  { chCode: 'CH21', equipmentName: '03P-B_MAIN', systemLabel: '03P-B_7', occurrences: 2 },
  { chCode: 'CH23', equipmentName: '03P-D_MAIN', systemLabel: '03P-D_6', occurrences: 2 },
  { chCode: 'CH26', equipmentName: '04P-C_MAIN', systemLabel: '04P-C_7', occurrences: 2 },
  { chCode: 'CH21', equipmentName: '12P-C_MAIN', systemLabel: '12P-C_4_7', occurrences: 2 },
  { chCode: 'CH21', equipmentName: '02P-B_MAIN', systemLabel: '02P-B_2', occurrences: 1 },
  { chCode: 'CH21', equipmentName: '02P-C_MAIN', systemLabel: '02P-C_3', occurrences: 1 },
  { chCode: 'CH29', equipmentName: '03P-C_MAIN', systemLabel: '03P-C_5', occurrences: 1 },
  { chCode: 'CH21', equipmentName: '04P-A_MAIN', systemLabel: '04P-A_6', occurrences: 1 },
  { chCode: 'CH26', equipmentName: '04P-A_MAIN', systemLabel: '04P-A_6', occurrences: 1 },
  { chCode: 'CH21', equipmentName: '04P-D_MAIN', systemLabel: '04P-D_4', occurrences: 1 },
  { chCode: 'CH21', equipmentName: '06P-A_MAIN', systemLabel: '06P-A_A(10)', occurrences: 1 },
  { chCode: 'CH21', equipmentName: '6P-D-MAIN', systemLabel: '06P-D_1', occurrences: 1 },
  { chCode: 'CH21', equipmentName: '08P-C_MAIN', systemLabel: '08P-C_F(15)', occurrences: 1 },
  { chCode: 'CH21', equipmentName: '11P-C_MAIN', systemLabel: '11P-C_4_5', occurrences: 1 },
  { chCode: 'CH21', equipmentName: '13P-A_MAIN', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH45', equipmentName: '15-P-C_MAIN', systemLabel: '15-P-C_D(13)O', occurrences: 3 },
  { chCode: 'CH42', equipmentName: '03P-D_MAIN', systemLabel: '03P-D_6', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'AGIBANK 1_4P-B (012)', systemLabel: '04P-B_5', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'AGIBANK 2_4P-B (011)', systemLabel: '04P-B_5', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'AGIBANK 3_4P-B (013)', systemLabel: '04P-B_5', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'AGIBANK 4_4P-B (032)', systemLabel: '04P-B_5', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'AGIBANK 5_4P-B (014)', systemLabel: '04P-B_5', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'AGIBANK 6_4P-B (036)', systemLabel: '04P-B_5', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'AGIBANK 7_4P-B (037)', systemLabel: '04P-B_5', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'MANUTENCAO_4P-B (035)', systemLabel: '04P-B_5', occurrences: 1 },
  { chCode: 'CH42', equipmentName: '07P-C_MAIN', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'COMERCIA 1_7P-C (060)', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'COMERCIAL 2_7P-C (062)', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'COMERCIAL 3_7P-C (064)', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'COMERCIAL 4_7P-C (066)', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'COMERCIAL 5_7P-C (067)', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'COMERCIAL 6_7P-C (065)', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'ENTRADA T.I_7P-C (063)', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'REUNIAO_7P-C (061)', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH45', equipmentName: 'L6.0E0_15P-C (0E0)', systemLabel: '15-P-C_D(13)O', occurrences: 1 },
  { chCode: 'CH45', equipmentName: 'L6.0E1_15P-C (0E1)', systemLabel: '15-P-C_D(13)O', occurrences: 1 },
  { chCode: 'CH45', equipmentName: 'L6.0E2_15P-C (0E2)', systemLabel: '15-P-C_D(13)O', occurrences: 1 },
  { chCode: 'CH45', equipmentName: 'L6.0E3_15P-C (0E3)', systemLabel: '15-P-C_D(13)O', occurrences: 1 },
]

const PEAK_SYSTEMS_BY_CH: Record<string, number[]> = {
  CH02: [22, 23, 24, 25, 26, 27, 28],
  CH21: [14, 15, 16, 17, 18, 19, 20, 21],
  CH29: [16, 17, 18, 19, 20, 21],
  CH26: [13, 14, 15, 16],
  CH53: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29],
}

function slugify(value: string) {
  return normalizeLabel(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function normalizeLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(\w+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-')
  const map: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
  }
  return `${map[month]}/${year.slice(2)}`
}

function getSystemId(systemName: string) {
  const baseSystem = westCorpSystems.find((item) => normalizeLabel(systemName).includes(normalizeLabel(item.systemName)))
  return baseSystem?.id ?? slugify(systemName)
}

function pad2(num: number) {
  return num.toString().padStart(2, '0')
}

function getOccurrenceIsoDate(chCode: string, rowHash: number, occurrenceIndex: number, totalOccurrences: number) {
  const peaks = PEAK_SYSTEMS_BY_CH[chCode] ?? [7, 12, 17, 22, 27]
  const peakCount = peaks.length
  const stride = Math.max(1, Math.ceil(totalOccurrences / peakCount))
  const bucket = Math.floor(occurrenceIndex / stride) % peakCount
  const baseDay = peaks[bucket]
  const daySpread = (occurrenceIndex % 3) - 1
  const day = clamp(baseDay + daySpread, 1, 31)

  const hourOffset = (rowHash + occurrenceIndex * 7) % 24
  const minuteOffset = (rowHash * 3 + occurrenceIndex * 13) % 60
  return `2026-07-${pad2(day)} ${pad2(hourOffset)}:${pad2(minuteOffset)}`
}

function buildAlarmMessage(row: WestCorpAggregatedRow) {
  const meta = CH_METADATA[row.chCode]
  const codeOnly = row.chCode.replace(/^CH/, '')
  const short = meta?.shortTitle ?? 'Alarme'
  const extra = meta?.description ? ` ${meta.description}` : ''
  return `${row.chCode} no equipamento ${row.equipmentName} (sistema ${row.systemLabel}). Codigo interno ${codeOnly} - ${short}.${extra}`.trim()
}

type ExpandedAlarmSeed = {
  row: WestCorpAggregatedRow
  isoDate: string
  occurrenceNumber: number
  totalOccurrences: number
}

const EXPANDED_SEEDS: ExpandedAlarmSeed[] = (() => {
  const list: ExpandedAlarmSeed[] = []
  RAW_AGGREGATED_ROWS.forEach((row, rowIndex) => {
    const rowHash = rowIndex % 1009
    for (let i = 0; i < row.occurrences; i += 1) {
      list.push({
        row,
        isoDate: getOccurrenceIsoDate(row.chCode, rowHash, i, row.occurrences),
        occurrenceNumber: i + 1,
        totalOccurrences: row.occurrences,
      })
    }
  })
  list.sort((a, b) => (a.isoDate > b.isoDate ? 1 : -1))
  return list
})()

export const westCorpAlarms: Alarm[] = EXPANDED_SEEDS.map((seed, index) => {
  const { row, isoDate, occurrenceNumber, totalOccurrences } = seed
  const meta = CH_METADATA[row.chCode]
  const codeOnly = row.chCode.replace(/^CH/, '')
  const category = meta?.category ?? 'Outdoor Error'
  const priority = meta?.severity === 'Medium' ? 2 : 1
  const isCritical = category.includes('Critical') || row.chCode === 'CH21' || row.chCode === 'CH29' || row.chCode === 'CH23' || row.chCode === 'CH26'
  const alarmType: Alarm['type'] = isCritical ? 'critical' : 'warning'
  const status: Alarm['status'] = totalOccurrences >= 4 ? 'pending_followup' : 'open'
  const systemId = getSystemId(row.systemLabel)

  return {
    id: `wc-jul26-${index + 1}`,
    equipmentId: `west-system-${systemId}`,
    equipmentName: row.equipmentName,
    type: alarmType,
    priority,
    status,
    message: buildAlarmMessage(row),
    createdAt: isoDate,
    updatedAt: isoDate,
    clientName: WEST_CORP_CLIENT,
    areaName: row.systemLabel,
    hasFollowup: totalOccurrences >= 2,
    followupCount: occurrenceNumber,
    errorCode: codeOnly,
    errorCategory: category,
    rawCode: row.chCode,
  }
})

type SystemMonthMetrics = {
  monthKey: string
  systemName: string
  systemId: string
  totalAlerts: number
  criticalAlerts: number
  warningAlerts: number
  outdoorAlerts: number
  indoorAlerts: number
  commAlerts: number
  sensorAlerts: number
  uniqueUnits: Set<string>
  firstDate: string
  lastDate: string
}

const groupedSystemMonthMetrics = RAW_AGGREGATED_ROWS.reduce<Map<string, SystemMonthMetrics>>((accumulator, row) => {
  const monthKey = '2026-07'
  const systemId = getSystemId(row.systemLabel)
  const key = `${monthKey}|${systemId}`
  const meta = CH_METADATA[row.chCode]
  const category = meta?.category ?? 'Outdoor Error'
  const isCritical = category === 'Critical Outdoor' || row.chCode === 'CH21' || row.chCode === 'CH29' || row.chCode === 'CH23' || row.chCode === 'CH26'
  const isOutdoor = category.includes('Outdoor') || category === 'Critical Outdoor'
  const isIndoor = category.includes('Indoor')
  const isComm = category === 'Communication Error'
  const isSensor = category === 'Sensor Alarm'

  const current = accumulator.get(key) ?? {
    monthKey,
    systemName: row.systemLabel,
    systemId,
    totalAlerts: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    outdoorAlerts: 0,
    indoorAlerts: 0,
    commAlerts: 0,
    sensorAlerts: 0,
    uniqueUnits: new Set<string>(),
    firstDate: '2026-07-31 23:59',
    lastDate: '2026-07-01 00:00',
  }

  current.totalAlerts += row.occurrences
  current.criticalAlerts += isCritical ? row.occurrences : 0
  current.warningAlerts += isCritical ? 0 : row.occurrences
  current.outdoorAlerts += isOutdoor ? row.occurrences : 0
  current.indoorAlerts += isIndoor ? row.occurrences : 0
  current.commAlerts += isComm ? row.occurrences : 0
  current.sensorAlerts += isSensor ? row.occurrences : 0
  current.uniqueUnits.add(normalizeLabel(row.equipmentName))
  accumulator.set(key, current)
  return accumulator
}, new Map())

function buildSystemSnapshot(metrics: SystemMonthMetrics): EquipmentMonthlySnapshot {
  const criticalPenalty = metrics.criticalAlerts * 3.2
  const severityIndex =
    metrics.totalAlerts * 0.55 +
    criticalPenalty +
    metrics.commAlerts * 1.8 +
    metrics.outdoorAlerts * 0.9 +
    metrics.indoorAlerts * 0.6 +
    metrics.uniqueUnits.size * 0.4

  const health = clamp(98.5 - severityIndex * 0.22, 44, 99)
  const availability = clamp(99.4 - metrics.totalAlerts * 0.065 - metrics.criticalAlerts * 0.22 - metrics.commAlerts * 0.18, 52, 99.9)
  const comfort = clamp(97.8 - metrics.indoorAlerts * 0.25 - metrics.sensorAlerts * 0.22, 55, 99.6)
  const performance = clamp(98.2 - metrics.totalAlerts * 0.06 - metrics.outdoorAlerts * 0.16 - metrics.commAlerts * 0.15, 54, 99.5)
  const mttr = Number(clamp(1.9 + metrics.criticalAlerts * 0.08 + metrics.outdoorAlerts * 0.025 + metrics.totalAlerts * 0.006, 1.9, 18).toFixed(2))

  return {
    id: `west-system-${metrics.systemId}`,
    name: metrics.systemName,
    type: 'VRV',
    area: WEST_CORP_SITE_NAME,
    client: WEST_CORP_CLIENT,
    siteId: WEST_CORP_SITE_ID,
    health: Number(health.toFixed(2)),
    availability: Number(availability.toFixed(2)),
    comfort: Number(comfort.toFixed(2)),
    performance: Number(performance.toFixed(2)),
    status: getHealthStatusText(health) as EquipmentMonthlySnapshot['status'],
    mttr,
    totalOccurrences: metrics.totalAlerts,
    criticalOccurrences: metrics.criticalAlerts,
    moderateOccurrences: metrics.warningAlerts,
    informativeOccurrences: 0,
    lastUpdated: '2026-07-31',
    monthKey: metrics.monthKey,
    month: toMonthLabel(metrics.monthKey),
    startDate: '2026-07-01',
    endDate: '2026-07-31',
  }
}

export const westCorpMonthlyEquipmentSnapshots: EquipmentMonthlySnapshot[] = Array.from(groupedSystemMonthMetrics.values())
  .map(buildSystemSnapshot)
  .sort((a, b) => b.totalOccurrences - a.totalOccurrences || a.name.localeCompare(b.name))

export const westCorpMonthlySummaries: MonthlySummary[] = (() => {
  const monthKey = '2026-07'
  const snapshots = westCorpMonthlyEquipmentSnapshots
  const count = snapshots.length || 1
  return [{
    monthKey,
    month: toMonthLabel(monthKey),
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    health: Number((snapshots.reduce((sum, item) => sum + item.health, 0) / count).toFixed(2)),
    target: 90,
    availability: Number((snapshots.reduce((sum, item) => sum + item.availability, 0) / count).toFixed(2)),
    mttr: Number((snapshots.reduce((sum, item) => sum + item.mttr, 0) / count).toFixed(2)),
    totalOccurrences: snapshots.reduce((sum, item) => sum + item.totalOccurrences, 0),
    affectedEquipment: snapshots.length,
  }]
})()

export const westCorpSiteMonthlySnapshots: SiteMonthlySnapshot[] = westCorpMonthlySummaries.map((summary) => ({
  ...westCorpSite,
  saudeGeral: summary.health,
  disponibilidade: summary.availability,
  conforto: Number(clamp(summary.health + 1.2, 0, 100).toFixed(2)),
  performance: Number(clamp(summary.health + 0.9, 0, 100).toFixed(2)),
  ocorrenciasCriticas: summary.totalOccurrences,
  ultimaAtualizacao: '31/07/2026',
  monthKey: summary.monthKey,
  month: summary.month,
}))

type UnitRollupAgg = {
  id: string
  unitName: string
  systemId: string
  systemName: string
  unitType: 'ODU' | 'IDU' | 'SYSTEM'
  totalAlerts: number
  criticalAlerts: number
  warningAlerts: number
  lastAlertAt: string
}

const unitRollupMap = RAW_AGGREGATED_ROWS.reduce<Map<string, UnitRollupAgg>>((accumulator, row, rowIndex) => {
  const systemId = getSystemId(row.systemLabel)
  const normalizedEquipment = normalizeLabel(row.equipmentName)
  const unitType: UnitRollupAgg['unitType'] =
    normalizedEquipment.includes('odu') || normalizedEquipment.includes('main') || normalizedEquipment.endsWith('main') || /\bsub\b/.test(normalizedEquipment)
      ? 'ODU'
      : normalizedEquipment.includes('multiple')
        ? 'SYSTEM'
        : 'IDU'

  const id = `${systemId}-${slugify(row.equipmentName)}`
  const lastDate = getOccurrenceIsoDate(row.chCode, rowIndex % 1009, row.occurrences - 1, row.occurrences)
  const meta = CH_METADATA[row.chCode]
  const category = meta?.category ?? 'Outdoor Error'
  const isCritical = category === 'Critical Outdoor' || row.chCode === 'CH21' || row.chCode === 'CH29' || row.chCode === 'CH23' || row.chCode === 'CH26'

  const current = accumulator.get(id) ?? {
    id,
    unitName: row.equipmentName,
    systemId,
    systemName: row.systemLabel,
    unitType,
    totalAlerts: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    lastAlertAt: lastDate,
  }

  current.totalAlerts += row.occurrences
  current.criticalAlerts += isCritical ? row.occurrences : 0
  current.warningAlerts += isCritical ? 0 : row.occurrences
  current.lastAlertAt = current.lastAlertAt > lastDate ? current.lastAlertAt : lastDate
  accumulator.set(id, current)
  return accumulator
}, new Map())

export const westCorpUnitHealthRollups: WestCorpUnitHealthRollup[] = Array.from(unitRollupMap.values())
  .map((item) => {
    const basePenalty = item.totalAlerts * (item.unitType === 'ODU' ? 2.9 : item.unitType === 'SYSTEM' ? 2.4 : 2.15)
    const criticalPenalty = item.criticalAlerts * (item.unitType === 'ODU' ? 2.2 : 1.6)
    const health = clamp(98.4 - basePenalty - criticalPenalty, 38, 99)
    const availability = clamp(99.3 - item.totalAlerts * (item.unitType === 'SYSTEM' ? 0.22 : 0.18) - item.criticalAlerts * 0.32, 44, 99.9)
    const mttr = clamp(1.6 + item.totalAlerts * 0.032 + item.criticalAlerts * 0.06 + (item.unitType === 'ODU' ? 0.4 : 0), 1.6, 16)

    return {
      ...item,
      health: Number(health.toFixed(2)),
      availability: Number(availability.toFixed(2)),
      mttr: Number(mttr.toFixed(2)),
      status: getHealthStatusText(health) as WestCorpUnitHealthRollup['status'],
    }
  })
  .sort((a, b) => b.totalAlerts - a.totalAlerts || a.unitName.localeCompare(b.unitName))

export const westCorpSystemsWithOccurrences = new Set(westCorpMonthlyEquipmentSnapshots.map((item) => item.id))

export function getWestCorpChMeta(code: string) {
  return CH_METADATA[code]
}
