import { SiteLocation, SiteSystemCatalog } from '@/types'

export const SBA_TORRES_BRASIL_CLIENT = 'SBA Torres Brasil'
export const SBA_TORRES_BRASIL_SITE_ID = 'sba-torres-brasil'
export const SBA_TORRES_BRASIL_SITE_NAME = 'SBA Torres Brasil'

function createSystem(
  systemName: string,
  outdoorUnits: string[],
  internalUnits: string[],
  status: 'active' | 'vacant' = 'active'
): SiteSystemCatalog {
  return {
    id: `${SBA_TORRES_BRASIL_SITE_ID}-${systemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`,
    client: SBA_TORRES_BRASIL_CLIENT,
    siteId: SBA_TORRES_BRASIL_SITE_ID,
    systemName,
    outdoorUnits,
    internalUnits,
    status,
  }
}

export const sbaTorresBrasilSite: SiteLocation = {
  siteId: SBA_TORRES_BRASIL_SITE_ID,
  nome: SBA_TORRES_BRASIL_SITE_NAME,
  cliente: SBA_TORRES_BRASIL_CLIENT,
  endereco: 'Avenida das Nacoes Unidas, 12399 - 5 andar - Brooklin Novo',
  cidade: 'Sao Paulo',
  estado: 'SP',
  latitude: -23.6071927,
  longitude: -46.6969467,
  saudeGeral: 0,
  disponibilidade: 0,
  conforto: 0,
  performance: 0,
  ocorrenciasCriticas: 0,
  ultimaAtualizacao: '',
}

export const sbaTorresBrasilSystems: SiteSystemCatalog[] = [
  createSystem(
    'UC-A SBA',
    ['ODU L7.001.0510 MASTER'],
    [
      'STAFF-09-A',
      'STAFF-10-A',
      'A-BAHIA',
      'STAFF-11-A',
      'A-SALA TI',
      'STAFF-12-A',
      'STAFF-13-A',
      'STAFF-14-A',
      'A-JAIME RODRIGUES',
      'A-SAO PAULO',
      'A-FRANCISCO OLIVEIRA',
      'STAFF-15-A',
      'STAFF-18-A',
      'STAFF-17-A',
      'STAFF-16-A',
      'STAFF-19-A',
      'STAFF-20-A',
      'A-MINAS GERAIS',
      'STAFF-21-A',
      'STAFF-22-A',
    ]
  ),
  createSystem(
    'UC-B SBA',
    ['UC-B SBA-MAIN', 'UC-B SBA-SUB'],
    [
      'RECEPCAO-A',
      'RECEPCAO-B',
      'STAFF-06-B',
      'B-BRASIL',
      'STAFF-00-B',
      'B-AFRICA DO SUL',
      '01 - SUPRIMENTOS',
      '02 - INFRAESTRUTURA',
      '03 - INFRAESTRUTURA',
      'RH GERENTE',
      'B-DEIVI LUCHETTA',
      'B-04B DISPONIVEL',
      'B-MURILO GONCALVES',
      'B-ROBERTO PIAZZA',
      'STAFF-02-B',
      'B-RIO DE JANEIRO',
      'B-SANTA CATARINA',
      'RH ANTE SALA',
      'STAFF-01-B',
      'STAFF-03-B',
      'STAFF-04-B',
      'STAFF-05-B',
      'STAFF-07-B',
      'STAFF-08-B',
      'COPA-02 B LADO PURIF.',
      'COPA-01 A LADO MERC.',
      'COPA-03 CENTRAL',
    ]
  ),
  createSystem('UC-CPD-A SBA', ['SISTEMA ODU MASTER'], ['CPD-01']),
  createSystem('UC-CPD-B SBA', ['SISTEMA ODU MASTER'], ['CPD-02']),
  createSystem(
    'UC-C SBA.MINI',
    ['ODU MASTER UC-C SBA'],
    ['B-GOIAS', 'B-NICARAGUA', 'B-EL SALVADOR', 'A-TOCANTINS', 'A-MARANHAO']
  ),
  createSystem('SISTEMA SPLIT INVERTER', [], ['B-RICARDO MURAKAMI (SPLIT)', 'A-AGDA QUEIROZ (SPLIT)', 'A-PAMELA SABEY (SPLIT)']),
]
