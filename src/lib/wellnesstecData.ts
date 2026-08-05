import { SiteLocation, SiteSystemCatalog } from '@/types'

export const WELLNESSTEC_CLIENT = 'Wellnesstec Tecnologia'
export const WELLNESSTEC_SITE_ID = 'cresol-baser-01'
export const WELLNESSTEC_SITE_NAME = 'Cresol-Baser 01'

function createSystem(
  systemName: string,
  outdoorUnits: string[],
  internalUnits: string[],
  status: 'active' | 'vacant' = 'active'
): SiteSystemCatalog {
  return {
    id: `${WELLNESSTEC_SITE_ID}-${systemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`,
    client: WELLNESSTEC_CLIENT,
    siteId: WELLNESSTEC_SITE_ID,
    systemName,
    outdoorUnits,
    internalUnits,
    status,
  }
}

export const wellnesstecSite: SiteLocation = {
  siteId: WELLNESSTEC_SITE_ID,
  nome: WELLNESSTEC_SITE_NAME,
  cliente: WELLNESSTEC_CLIENT,
  endereco: 'R. Ernesto Sanderson 101',
  cidade: 'Francisco Beltrao',
  estado: 'PR',
  latitude: -26.0645,
  longitude: -53.0649,
  saudeGeral: 0,
  disponibilidade: 0,
  conforto: 0,
  performance: 0,
  ocorrenciasCriticas: 0,
  ultimaAtualizacao: '',
}

export const wellnesstecSystems: SiteSystemCatalog[] = [
  createSystem(
    'UC-03 P1N/P2N',
    ['UC-03N-P1P2.M.300 (MASTER)', 'UC-03N-P1P2.E.301 (SLAVE)'],
    [
      'L6.05C.008D',
      'UE16/03P1N-ESCRITORIO (49)',
      'UE17/03P1N-ESCRITORIO (4A)',
      'UE18/03P1N-ESCRITORIO (4B)',
      'UE19/03P1N-ESCRITORIO (4C)',
      'UE21/03P1N-ESCRITORIO (4E)',
      'UE22/03P1N-ESCRITORIO (4F)',
      'UE23/03P1N-ESCRITORIO (50)',
      'UE25/03P1N-ESCRITORIO (52)',
      'UE26/03P1N-ESCRITORIO (53)',
      'UE27/03P1N-ESCRITORIO (54)',
      'UE28/03P1N-ESCRITORIO (55)',
      'UE29/03P1N-ESCRITORIO (56)',
      'UE31/03P1N-ESCRITORIO (58)',
      'UE32/03P1N-ESCRITORIO (59)',
      'UE33/03P1N-ESCRITORIO (5A)',
      'UE34/03P1N-ESCRITORIO (5B)',
      'UE36/03P1N-ESCRITORIO (5D)',
      'UE01/03P2N-ESCRITORIO (3A)',
      'UE02/03P2N-ESCRITORIO (3B)',
      'UE03/03P2N-ESCRITORIO (3C)',
      'UE04/03P2N-ESCRITORIO (3D)',
      'UE05/03P2N-ESCRITORIO (3E)',
      'UE06/03P2N-ESCRITORIO (3F)',
      'UE07/03P2N-ESCRITORIO (40)',
      'UE08/03P2N-ESCRITORIO (41)',
      'UE09/03P2N-ESCRITORIO (42)',
      'UE10/03P2N-ESCRITORIO (43)',
      'UE11/03P2N-ESCRITORIO (44)',
      'UE12/03P2N-ESCRITORIO (45)',
      'UE13/03P2N-ESCRITORIO (46)',
      'UE14/03P2N-ESCRITORIO (47)',
      'UE15/03P2N-ESCRITORIO (48)',
      'L6.05C.008D (Reserva/Cadastro adicional)',
    ]
  ),
  createSystem(
    'UC-02 S-P1/P2',
    ['UC-02S-P1/P2.M.200 (MASTER)', 'UC-02S-P1/P2.E.201 (SLAVE)'],
    [
      'UE01/02P1S-ESCRITORIO (20)',
      'UE02/02P1S-ESCRITORIO (21)',
      'UE03/02P1S-ESCRITORIO (22)',
      'UE04/02P1S-ESCRITORIO (23)',
      'UE05/02P1S-ESCRITORIO (24)',
      'UE06/02P1S-ESCRITORIO (25)',
      'UE07/02P1S-ESCRITORIO (26)',
      'UE08/02P1S-ESCRITORIO (27)',
      'UE09/02P1S-ESCRITORIO (28)',
      'UE10/02P1S-ESCRITORIO (29)',
      'UE11/02P1S-ESCRITORIO (2A)',
      'UE12/02P1S-ESCRITORIO (2B)',
      'UE13/02P2S-ESCRITORIO (2C)',
      'UE14/02P2S-ESCRITORIO (2D)',
      'UE15/02P2S-CAB. FINANC. (2E)',
      'UE16/02P2S-ESCRITORIO (2F)',
      'UE17/02P2S-ESCRITORIO (30)',
      'UE18/02P2S-ESCRITORIO (31)',
      'UE19/02P2S-ESCRITORIO (32)',
      'UE20/02P2S-ESCRITORIO (34)',
      'UE21/02P2S-ESCRITORIO (35)',
      'UE22/02P2S-ESCRITORIO (36)',
      'UE23/02P2S-ESCRITORIO (37)',
      'UE24/02P2S-ESCRITORIO (38)',
      'UE25/02P2S-ESCRITORIO (39)',
    ]
  ),
  createSystem(
    'UC-10 P3',
    ['UC-10P3.M.A00 (MASTER)', 'UC-10P3.E.A01 (SLAVE)'],
    [
      'UE01/10P3S - RECEPCAO DIR. (6A)',
      'UE02/10P3S - CONSELHO (6B)',
      'UE03/10P3S - CONSELHO (6C)',
      'UE04/10P3S - ESCRITORIO (6D)',
      'UE05/10P3S - ESCRITORIO (6E)',
      'UE06/10P3S - ESCRITORIO (6F)',
      'UE07/10P3S - ESCRITORIO (70)',
      'UE08/10P3S - ADRIANO (72)',
      'UE09/10P3S - THOME (73)',
      'UE10/10P3N - ESCRITORIO-D (74)',
      'UE11/10P3N - ESCRITORIO-D (75)',
      'UE12/10P3N - ESCRITORIO-D (76)',
      'UE13/10P3N - ESCRITORIO-D (77)',
      'UE14/10P3N - ESCRITORIO-D (78)',
      'UE15/10P3N - ESCRITORIO-D (80)',
      'UE16/10P3N - CIRC-D (FA)',
      'UE17/10P3S - CIRC-D (FB)',
    ]
  ),
  createSystem(
    'UC-06 P1N-DIRETORIA / P2S',
    ['UC-06S-P1/P2.600 (MASTER)'],
    [
      'UE01/06P1N - DIRETORIA (19)',
      'UE02/06P2S - SALA (1A)',
      'UE03/06P2S - SALA 9 (1B)',
      'UE04/06P2S - MONITORAMENTO (1C)',
      'UE05/06P2S - MONITORAMENTO (1D)',
      'UE06/06P2S - MONITORAMENTO (1E)',
      'UE07/06P2S - MONITORAMENTO (1F)',
    ]
  ),
  createSystem(
    'UC-07 P3N',
    ['UC-07P3N.700 (MASTER)'],
    [
      'UE01/07P3N - ESCRITORIO-D (81)',
      'UE02/07P3N - VIDRO-D (82)',
    ]
  ),
  createSystem(
    'UC-08 P1N / P2N',
    ['UC-08N-P1/P2.800 (MASTER)'],
    [
      'UE01/08P2N - SALA (83)',
      'UE02/08P1N - SALA (84)',
    ]
  ),
  createSystem(
    'UC-09 P1N / P2N',
    ['UC-09-P1N/P2N.900 (MASTER)'],
    [
      'UE01/09P2N (5E)',
      'UE02/09P2N (5F)',
      'UE03/09P2N-D (60)',
      'UE04/09P1N (61)',
      'UE05/09P1N (62)',
      'UE06/09P1N-D (63)',
    ]
  ),
  createSystem(
    'UC-11 P2NS / P4N',
    ['UC-11-P2/P4.M.B00 (MASTER)', 'UC-11-P2/P4.E.B01 (SLAVE)'],
    [
      'UE01/11P2S - D (64)',
      'UE02/11P2S - CIRC-D (65)',
      'UE03/11P2N - CIRC-D (66)',
      'UE04/11P2N (67)',
      'UE05/11P2N - D (68)',
      'UE06/11P2N - D (69)',
      'UE07/11P4N - EVENTOS (FC)',
    ]
  ),
  createSystem(
    'UC-05 T / AUDITORIO',
    ['UC-05T-AUD.000 (MASTER)'],
    [
      'UE01/05T - AUDITORIO-D (16)',
      'UE02/05T - AUDITORIO-D (15)',
      'UE03/05T - AUDITORIO-D (18)',
      'UE04/05T - AUDITORIO-D (17)',
    ]
  ),
  createSystem(
    'UC-01T NB / ATM',
    ['UC-01T-NB/ATM (MASTER)'],
    [
      'UE01/01T - ATM (02)',
      'UE02/01T - NOBREAK (01)',
    ]
  ),
  createSystem(
    'UC-04T / P1 - DUTO TERREO',
    ['UC-04T/P1.000 (MASTER)', 'UC-04T/P1.001 (SLAVE)'],
    [
      'UE02/04T - VIGILANTE (04)',
      'UE03/04T - CORRETORA (05)',
      'UE04/04T - CORRETORA (06)',
      'UE05/04T - MESAS-D / CORRETORA (07)',
      'UE06/04T - CORRETORA-D (08)',
      'UE07/04T - CORRETORA-D (09)',
      'UE08/04T - ALMOXARIFADO (10)',
      'UE09/04T - AGENCIA CASSETE (11)',
      'UE11/04P1N - CORRETORA-D (14)',
      'L7.011.01D1-T',
      'L7.007.01D1-T COPA',
      'L7.012.01D1-T AGENCIA DUTO',
      'L7.013.01D1-T LOUNGE 01',
      'L7.014.01D1-T LOUNGE 02',
    ]
  ),
]
