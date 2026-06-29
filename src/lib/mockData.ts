import {
  Equipment,
  WeeklyUpdate,
  HealthTrendData,
  UptimeData,
  User,
  Alarm,
  PredictiveTask,
  SystemRanking,
  EnergyData,
  IEERData,
  WaterData
} from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Joao Silva',
  email: 'joao.silva@empresa.com',
  role: 'manager',
  password: 'senha123',
  createdAt: '2024-01-15'
};

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Joao Silva',
    email: 'joao.silva@empresa.com',
    role: 'manager',
    password: 'senha123',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    email: 'maria.oliveira@empresa.com',
    role: 'technician',
    password: 'tecnica456',
    createdAt: '2024-03-22'
  },
  {
    id: '3',
    name: 'Carlos Santos',
    email: 'carlos.santos@empresa.com',
    role: 'admin',
    password: 'admin789',
    createdAt: '2023-11-05'
  }
];

export const mockEquipment: Equipment[] = [
  {
    id: '1',
    name: 'Equipamento 1',
    type: 'Split',
    area: 'Andar 1',
    client: 'Empresa ABC',
    health: 93.66389868235102,
    availability: 95.57014245903369,
    comfort: 89.60694279531526,
    performance: 94.06306561430208,
    status: 'Verde',
    mttr: 3.1937791657945316,
    totalOccurrences: 2,
    criticalOccurrences: 0,
    moderateOccurrences: 2,
    informativeOccurrences: 0,
    lastUpdated: '2025-06-25'
  },
  {
    id: '2',
    name: 'Equipamento 2',
    type: 'Split',
    area: 'Andar 1',
    client: 'Empresa ABC',
    health: 94.11654580033559,
    availability: 98.64908956922407,
    comfort: 89.22338650110666,
    performance: 91.41758912915246,
    status: 'Verde',
    mttr: 4.395778337840916,
    totalOccurrences: 1,
    criticalOccurrences: 0,
    moderateOccurrences: 0,
    informativeOccurrences: 1,
    lastUpdated: '2025-06-25'
  },
  {
    id: '3',
    name: 'Equipamento 3',
    type: 'Cassete',
    area: 'Andar 2',
    client: 'Empresa ABC',
    health: 95.0359235538747,
    availability: 98.81763844652217,
    comfort: 93.22973891661164,
    performance: 90.71157684219514,
    status: 'Verde',
    mttr: 5.512038396816163,
    totalOccurrences: 1,
    criticalOccurrences: 0,
    moderateOccurrences: 0,
    informativeOccurrences: 1,
    lastUpdated: '2025-06-25'
  },
  {
    id: '4',
    name: 'Equipamento 4',
    type: 'Split',
    area: 'Andar 2',
    client: 'Empresa ABC',
    health: 92.71883250081063,
    availability: 95.7076801307579,
    comfort: 88.30632922875014,
    performance: 90.72281073928923,
    status: 'Verde',
    mttr: 0,
    totalOccurrences: 0,
    criticalOccurrences: 0,
    moderateOccurrences: 0,
    informativeOccurrences: 0,
    lastUpdated: '2025-06-25'
  },
  {
    id: '5',
    name: 'Equipamento 5',
    type: 'Cassete',
    area: 'Andar 3',
    client: 'Empresa ABC',
    health: 87.8020062295587,
    availability: 92.18843837284629,
    comfort: 81.01807267435292,
    performance: 86.75209293083082,
    status: 'Amarelo',
    mttr: 6.264286995811446,
    totalOccurrences: 3,
    criticalOccurrences: 1,
    moderateOccurrences: 2,
    informativeOccurrences: 0,
    lastUpdated: '2025-06-25'
  }
];

export const mockWeeklyUpdates: WeeklyUpdate[] = [
  {
    id: '1',
    date: '2026-06-20',
    title: 'Manutencao Preventiva Concluida',
    content: 'Realizada manutencao preventiva em equipamentos. Todos apresentam desempenho dentro dos parametros esperados.',
    author: 'Carlos Santos'
  },
  {
    id: '2',
    date: '2026-06-18',
    title: 'Atualizacao de SLA',
    content: 'Ajuste nas metas de SLA para o cliente Hospital XYZ. Nova meta de disponibilidade: 97%.',
    author: 'Maria Oliveira'
  },
  {
    id: '3',
    date: '2026-06-15',
    title: 'Nova Instalacao',
    content: 'Instalacao concluida de novos equipamentos VRV no Shopping Center, area de expansao.',
    author: 'Joao Silva'
  }
];

export const mockAlarms: Alarm[] = [
  {
    id: '1',
    equipmentId: '5',
    equipmentName: 'Equipamento 5',
    type: 'critical',
    message: 'Temperatura alta detectada - risco de sobreaquecimento',
    status: 'pending_followup',
    priority: 1,
    createdAt: '2026-06-25',
    updatedAt: '2026-06-26',
    clientName: 'Empresa ABC',
    areaName: 'Andar 3',
    hasFollowup: true,
    followupCount: 3
  },
  {
    id: '2',
    equipmentId: '1',
    equipmentName: 'Equipamento 1',
    type: 'warning',
    message: 'Filtro de ar precisando de substituicao',
    status: 'acknowledged',
    priority: 2,
    createdAt: '2026-06-22',
    updatedAt: '2026-06-23',
    clientName: 'Empresa ABC',
    areaName: 'Andar 1',
    hasFollowup: false,
    followupCount: 0
  },
  {
    id: '3',
    equipmentId: '3',
    equipmentName: 'Equipamento 3',
    type: 'warning',
    message: 'Eficiencia reduzida - verificar evaporador',
    status: 'pending_followup',
    priority: 3,
    createdAt: '2026-06-20',
    updatedAt: '2026-06-25',
    clientName: 'Empresa ABC',
    areaName: 'Andar 2',
    hasFollowup: true,
    followupCount: 5
  },
  {
    id: '4',
    equipmentId: '2',
    equipmentName: 'Equipamento 2',
    type: 'info',
    message: 'Manutencao preventiva programada',
    status: 'open',
    priority: 4,
    createdAt: '2026-06-24',
    updatedAt: '2026-06-24',
    clientName: 'Empresa ABC',
    areaName: 'Andar 1',
    hasFollowup: false,
    followupCount: 0
  }
];

export const mockPredictiveTasks: PredictiveTask[] = [
  {
    id: '1',
    equipmentId: '5',
    equipmentName: 'Equipamento 5',
    type: 'maintenance',
    title: 'Troca de compressor',
    description: 'Analise preditiva indica falha em componente principal em proximas 2 semanas',
    priority: 'high',
    dueDate: '2026-07-10',
    status: 'pending',
    riskScore: 85,
    estimatedCost: 5200
  },
  {
    id: '2',
    equipmentId: '1',
    equipmentName: 'Equipamento 1',
    type: 'inspection',
    title: 'Verificacao de condensador',
    description: 'Leituras indicam possivel obstrucao',
    priority: 'medium',
    dueDate: '2026-07-05',
    status: 'in_progress',
    riskScore: 45,
    estimatedCost: 800
  },
  {
    id: '3',
    equipmentId: '3',
    equipmentName: 'Equipamento 3',
    type: 'replacement',
    title: 'Troca de filtros especiais',
    description: 'Vida util estimada atingida',
    priority: 'low',
    dueDate: '2026-07-20',
    status: 'pending',
    riskScore: 20,
    estimatedCost: 350
  }
];

export const mockSystemRankings: SystemRanking[] = [
  {
    id: '1',
    clientName: 'Hospital XYZ',
    systemName: 'Sistema VRV - Bloco Cirurgico',
    totalAlarms: 24,
    criticalAlarms: 6,
    healthScore: 72,
    availability: 88,
    rank: 1,
    trend: 'down'
  },
  {
    id: '2',
    clientName: 'Shopping Center',
    systemName: 'Sistema Chiller - Principal',
    totalAlarms: 18,
    criticalAlarms: 2,
    healthScore: 85,
    availability: 94,
    rank: 2,
    trend: 'stable'
  },
  {
    id: '3',
    clientName: 'Empresa ABC',
    systemName: 'Sistema Split - Andares Administrativos',
    totalAlarms: 12,
    criticalAlarms: 1,
    healthScore: 91,
    availability: 96,
    rank: 3,
    trend: 'up'
  }
];

export const mockEnergyData: EnergyData[] = [
  { month: 'Jan/26', kwhConsumed: 15200, kwhCost: 1976, target: 14500, previousYear: 16800 },
  { month: 'Fev/26', kwhConsumed: 14800, kwhCost: 1924, target: 14500, previousYear: 15900 },
  { month: 'Mar/26', kwhConsumed: 16500, kwhCost: 2145, target: 15000, previousYear: 17200 },
  { month: 'Abr/26', kwhConsumed: 17200, kwhCost: 2236, target: 16000, previousYear: 18500 },
  { month: 'Mai/26', kwhConsumed: 15800, kwhCost: 2054, target: 15500, previousYear: 16900 },
  { month: 'Jun/26', kwhConsumed: 14500, kwhCost: 1885, target: 15000, previousYear: 15500 }
];

export const mockIEERData: IEERData[] = [
  {
    equipmentId: '1',
    equipmentName: 'Equipamento 1',
    ieer: 18.5,
    target: 20,
    efficiency: 92.5,
    lastUpdated: '2026-06-25'
  },
  {
    equipmentId: '2',
    equipmentName: 'Equipamento 2',
    ieer: 16.2,
    target: 18,
    efficiency: 90,
    lastUpdated: '2026-06-25'
  },
  {
    equipmentId: '3',
    equipmentName: 'Equipamento 3',
    ieer: 22.1,
    target: 20,
    efficiency: 110.5,
    lastUpdated: '2026-06-25'
  }
];

export const mockWaterData: WaterData[] = [
  { month: 'Jan/26', cubicMeters: 125, cost: 225, target: 110, previousYear: 140 },
  { month: 'Fev/26', cubicMeters: 118, cost: 212.4, target: 110, previousYear: 132 },
  { month: 'Mar/26', cubicMeters: 132, cost: 237.6, target: 120, previousYear: 145 },
  { month: 'Abr/26', cubicMeters: 115, cost: 207, target: 110, previousYear: 128 },
  { month: 'Mai/26', cubicMeters: 108, cost: 194.4, target: 110, previousYear: 115 },
  { month: 'Jun/26', cubicMeters: 105, cost: 189, target: 100, previousYear: 110 }
];

export const mockHealthTrend: HealthTrendData[] = [
  { month: 'Jan/26', health: 92, target: 90 },
  { month: 'Fev/26', health: 94, target: 90 },
  { month: 'Mar/26', health: 93, target: 90 },
  { month: 'Abr/26', health: 91, target: 90 },
  { month: 'Mai/26', health: 93, target: 90 },
  { month: 'Jun/26', health: 95, target: 90 }
];

export const mockUptimeData: UptimeData[] = [
  { month: 'Jan/26', availability: 95 },
  { month: 'Fev/26', availability: 97 },
  { month: 'Mar/26', availability: 96 },
  { month: 'Abr/26', availability: 95 },
  { month: 'Mai/26', availability: 96 },
  { month: 'Jun/26', availability: 97 }
];
