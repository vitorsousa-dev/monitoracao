import io
import json
import os
import sys
from datetime import datetime

import pandas as pd

# Configurar UTF-8 para saida
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def build_status(saude):
    if saude >= 90:
        return 'Verde'
    if saude >= 80:
        return 'Amarelo'
    return 'Vermelho'


def format_date_key(data_key):
    data_key = str(int(data_key))
    return f'{data_key[:4]}-{data_key[4:6]}-{data_key[6:]}'


def clamp(value, low, high):
    return max(low, min(high, value))


def to_ts_export(name, type_name, value):
    return f'export const {name}: {type_name} = {json.dumps(value, ensure_ascii=False, indent=2)};'


ALARM_LOGS_RAW = """
28/05/26 18:50 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
28/05/26 18:20 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
28/05/26 17:40 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
28/05/26 13:55 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
28/05/26 13:25 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
28/05/26 12:50 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
28/05/26 18:55 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
25/05/26 18:25 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
25/05/26 17:50 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
25/05/26 17:00 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
22/05/26 09:15 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
21/05/26 16:15 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
21/05/26 15:45 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
21/05/26 15:05 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
21/05/26 14:35 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
20/05/26 18:55 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
20/05/26 18:25 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
20/05/26 10:35 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
19/05/26 18:55 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
19/05/26 18:20 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
19/05/26 17:50 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
19/05/26 17:15 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
19/05/26 16:15 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
19/05/26 15:20 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
19/05/26 14:30 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
19/05/26 13:50 | R24.13-REUNIÃO 13 (010) | Serasa Experian - PDC | Midea_7 | P0 | High
18/05/26 17:50 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
18/05/26 13:40 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
18/05/26 13:05 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
18/05/26 11:25 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
18/05/26 10:45 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
14/05/26 10:10 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
14/05/26 21:55 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
14/05/26 21:15 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
14/05/26 20:45 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
14/05/26 11:30 | R24.12-AUSTRÁLIA (041) | Serasa Experian - PDC | Midea_4 | 4F | High
13/05/26 21:55 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
13/05/26 21:20 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
13/05/26 20:45 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
13/05/26 20:15 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
12/05/26 17:50 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
12/05/26 13:00 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
12/05/26 12:25 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
12/05/26 12:00 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
11/05/26 18:35 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
11/05/26 18:10 | R24.14-REUNIÃO 14 (011) | Serasa Experian - PDC | Midea_7 | P0 | High
""".strip()


def parse_alarm_logs(raw_text):
    alarm_events = []
    for line in raw_text.splitlines():
        parts = [part.strip() for part in line.split('|')]
        if len(parts) != 6:
            continue

        timestamp_raw, equipment_raw, client_raw, system_raw, alarm_code, severity = parts
        alarm_dt = datetime.strptime(timestamp_raw, '%d/%m/%y %H:%M')
        equipment_name = equipment_raw.rsplit('(', 1)[0].strip()
        client_name = client_raw.split(' - ')[0].strip()
        system_name = system_raw.strip().lower()

        alarm_events.append({
            'timestamp': alarm_dt,
            'timestampRaw': timestamp_raw,
            'equipmentName': equipment_name,
            'clientName': client_name,
            'systemName': system_name,
            'alarmCode': alarm_code,
            'severity': severity,
        })

    alarm_events.sort(key=lambda item: item['timestamp'], reverse=True)
    return alarm_events


def build_alarm_priority(alarm_code):
    if alarm_code == 'P0':
        return 1
    if alarm_code == '4F':
        return 2
    return 3


def csv_to_mock_data():
    """
    Converte os arquivos CSV para o arquivo mockData.ts usado na aplicacao React.
    """
    print('Convertendo CSV para dados mock...')

    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_path, 'data')

    try:
        df_clientes = pd.read_csv(os.path.join(data_path, 'DimCliente.csv'), sep=';', encoding='utf-8-sig')
        df_contratos = pd.read_csv(os.path.join(data_path, 'DimContrato.csv'), sep=';', encoding='utf-8-sig')
        df_areas = pd.read_csv(os.path.join(data_path, 'DimArea.csv'), sep=';', encoding='utf-8-sig')
        df_equipamentos = pd.read_csv(os.path.join(data_path, 'DimEquipamento.csv'), sep=';', encoding='utf-8-sig')
        df_fato = pd.read_csv(os.path.join(data_path, 'FatoMonitoramento.csv'), sep=';', encoding='utf-8-sig')

        clientes = {int(row['ClienteKey']): row for _, row in df_clientes.iterrows()}
        contratos = {int(row['ContratoKey']): row for _, row in df_contratos.iterrows()}
        areas = {int(row['AreaKey']): row for _, row in df_areas.iterrows()}
        equipamentos_dim = {int(row['EquipamentoKey']): row for _, row in df_equipamentos.iterrows()}

        latest_rows = {}
        for _, row in df_fato.iterrows():
            eq_key = int(row['EquipamentoKey'])
            data_key = int(row['DataKey'])
            if eq_key not in latest_rows or int(latest_rows[eq_key]['DataKey']) < data_key:
                latest_rows[eq_key] = row

        alarm_events = parse_alarm_logs(ALARM_LOGS_RAW)
        alarm_counts = {}
        latest_alarm_by_equipment = {}
        for alarm in alarm_events:
            equipment_name = alarm['equipmentName']
            alarm_counts[equipment_name] = alarm_counts.get(equipment_name, 0) + 1
            latest_alarm_by_equipment.setdefault(equipment_name, alarm)

        mock_equipment = []
        for eq_key in sorted(latest_rows.keys()):
            fato_row = latest_rows[eq_key]
            eq_row = equipamentos_dim[eq_key]
            area_row = areas[int(eq_row['AreaKey'])]
            contrato_row = contratos[int(area_row['ContratoKey'])]
            cliente_row = clientes[int(contrato_row['ClienteKey'])]
            equipment_name = str(eq_row['EquipamentoNome'])
            alarm_total = alarm_counts.get(equipment_name, int(fato_row['OcorrenciasTotal']))
            availability = round(float(fato_row['Disponibilidade']), 2)
            comfort = round(float(fato_row['Conforto']), 2)
            performance = round(float(fato_row['Performance']), 2)
            health = round(float(fato_row['Saude']), 2)
            mttr = round(float(fato_row['MTTR']), 2)

            equipamento = {
                'id': str(eq_key),
                'name': equipment_name,
                'type': str(eq_row['EquipamentoTipo']),
                'area': str(area_row['AreaNome']),
                'client': str(cliente_row['ClienteNome']),
                'health': health,
                'availability': availability,
                'comfort': comfort,
                'performance': performance,
                'status': build_status(health),
                'mttr': mttr,
                'totalOccurrences': alarm_total,
                'criticalOccurrences': alarm_counts.get(equipment_name, int(fato_row['OcorrenciasCriticas'])),
                'moderateOccurrences': int(fato_row['OcorrenciasModeradas']),
                'informativeOccurrences': int(fato_row['OcorrenciasInformativas']),
                'lastUpdated': format_date_key(fato_row['DataKey']),
            }
            mock_equipment.append(equipamento)

        mock_user = {
            'id': 'admin-1',
            'name': 'Vitor Fantoni',
            'email': 'proactive.service.latam@coolautomation.com',
            'role': 'admin',
            'password': 'admin123',
            'createdAt': '2026-06-29',
            'clientAccess': ['*'],
        }

        mock_users = [
            mock_user,
            {
                'id': 'admin-2',
                'name': 'Edson',
                'email': 'edson@coolautomation.com',
                'role': 'admin',
                'password': 'admin123',
                'createdAt': '2026-06-29',
                'clientAccess': ['*'],
            },
            {
                'id': 'manager-1',
                'name': 'Gerente Serasa',
                'email': 'gerente@serasaexperian.com',
                'role': 'manager',
                'password': 'gerente123',
                'createdAt': '2026-06-29',
                'clientAccess': ['Serasa Experian'],
            },
        ]

        client_name = mock_equipment[0]['client'] if mock_equipment else 'Cliente'
        system_names = []
        for equipment in mock_equipment:
            if equipment['area'] not in system_names:
                system_names.append(equipment['area'])

        top_problematic = sorted(
            mock_equipment,
            key=lambda item: (
                item['criticalOccurrences'],
                item['totalOccurrences'],
                -item['health'],
            ),
            reverse=True,
        )

        mock_weekly_updates = [
            {
                'id': '1',
                'date': '2026-06-29',
                'title': 'Importacao do Log de Alarmes',
                'content': f'Foram incorporados {len(alarm_events)} registros reais de alarmes de maio e junho para o cliente {client_name}, com destaque para os equipamentos mais reincidentes.',
                'author': 'Carlos Santos',
            },
            {
                'id': '2',
                'date': '2026-06-28',
                'title': 'Ranking por Equipamento',
                'content': 'O dashboard agora prioriza o ranking dos equipamentos com maior recorrencia de alarmes para apoiar o follow-up operacional.',
                'author': 'Maria Oliveira',
            },
            {
                'id': '3',
                'date': '2026-06-27',
                'title': 'Estrutura Pronta para Novos Dados',
                'content': 'A base esta preparada para receber os proximos dados operacionais, alarmes recorrentes e indicadores de desempenho por equipamento.',
                'author': 'Joao Silva',
            },
        ]

        equipment_by_name = {equipment['name']: equipment for equipment in mock_equipment}

        mock_alarms = []
        for idx, alarm in enumerate(alarm_events, start=1):
            equipment_name = alarm['equipmentName']
            equipment = equipment_by_name.get(equipment_name)
            latest_alarm = latest_alarm_by_equipment[equipment_name]
            is_latest_alarm = latest_alarm['timestamp'] == alarm['timestamp']
            followup_count = alarm_counts[equipment_name]
            status = 'pending_followup' if is_latest_alarm and followup_count > 1 else 'acknowledged'
            if followup_count == 1:
                status = 'open'

            mock_alarms.append({
                'id': str(idx),
                'equipmentId': equipment['id'] if equipment else str(idx),
                'equipmentName': equipment_name,
                'type': 'critical' if alarm['severity'].lower() == 'high' else 'warning',
                'message': f"Alarme {alarm['alarmCode']} registrado com severidade {alarm['severity']}.",
                'status': status,
                'priority': build_alarm_priority(alarm['alarmCode']),
                'createdAt': alarm['timestamp'].strftime('%Y-%m-%d %H:%M'),
                'updatedAt': latest_alarm['timestamp'].strftime('%Y-%m-%d %H:%M'),
                'clientName': alarm['clientName'],
                'areaName': alarm['systemName'],
                'hasFollowup': followup_count > 1,
                'followupCount': followup_count if is_latest_alarm else max(followup_count - 1, 0),
            })

        predictive_analysis_map = {
            'R24.14-REUNIÃO 14': {
                'id': '1',
                'type': 'inspection',
                'title': 'Analise Tecnica - R24.14 Reuniao 14',
                'description': 'Analise preditiva concentrada na recorrencia de alarmes P0 e na incapacidade de atingir o setpoint.',
                'technicalAnalysis': 'A unidade apresenta forte indicio de anomalia no controle da expansao do refrigerante, com suspeita prioritaria de falha mecanica ou vazamento interno da valvula de expansao eletronica (EEV).',
                'detailedAnalysis': [
                    'Durante o periodo analisado a unidade permaneceu em operacao com recorrencia de alarmes de incapacidade de atingir o setpoint.',
                    'Os sensores do evaporador apresentaram queda progressiva de temperatura ate aproximadamente -12°C, enquanto a EEV operou frequentemente proxima da abertura maxima, em torno de 304 pls.',
                    'Mesmo apos alteracao da velocidade do ventilador para FAN HIGH, os sensores continuaram reduzindo para temperaturas negativas, o que reduz a probabilidade de falha primaria por ventilacao insuficiente.',
                    'Os indicios apontam para anomalia no controle da expansao do refrigerante, com forte suspeita de falha mecanica ou vazamento interno da EEV, hipotese que deve ser priorizada na inspecao corretiva.',
                    'Como a unidade pertence ao mesmo sistema da Reuniao 13 e apresenta comportamento semelhante, recomenda-se complementar a investigacao com a avaliacao da estrategia de controle da condensadora e do circuito frigorifico.'
                ],
                'priority': 'high',
                'status': 'in_progress',
                'dueDate': '2026-07-05',
                'estimatedCost': 4800,
            },
            'R24.13-REUNIÃO 13': {
                'id': '2',
                'type': 'inspection',
                'title': 'Analise Tecnica - R24.13 Reuniao 13',
                'description': 'Analise preditiva focada na repetibilidade da anomalia operacional e na abertura elevada da EEV ao longo do ciclo.',
                'technicalAnalysis': 'A unidade apresenta comportamento operacional semelhante ao da Reuniao 14, reforcando a suspeita de anomalia no circuito de expansao e a necessidade de validar tambem a influencia sistemica do conjunto condensador.',
                'detailedAnalysis': [
                    'Foi identificado comportamento operacional semelhante ao da unidade R24.14, com alerta recorrente de nao atendimento ao setpoint e operacao continua em modo COOL.',
                    'Durante a analise, a temperatura ambiente permaneceu proxima de 19°C a 20°C, enquanto os sensores do evaporador reduziram ate aproximadamente -6°C durante a operacao.',
                    'A EEV operou entre aproximadamente 200 e 304 pls, mantendo elevada abertura durante boa parte do ciclo, sem variacoes significativas na corrente do compressor que justificassem o comportamento observado.',
                    'Em 26/06/2026 foi novamente registrado o mesmo alerta operacional, mantendo-se a EEV em 304 pls e o ambiente sem atingir a condicao de controle esperada.',
                    'A repetibilidade da anomalia ao longo dos dias descarta ocorrencia pontual e reforca a recomendacao de inspecao da EEV, dos comandos eletricos associados e da estrategia de controle da unidade condensadora.'
                ],
                'priority': 'high',
                'status': 'pending',
                'dueDate': '2026-07-05',
                'estimatedCost': 4800,
            },
        }

        mock_predictive_tasks = []
        for equipment_name in ['R24.14-REUNIÃO 14', 'R24.13-REUNIÃO 13']:
            equipment = equipment_by_name.get(equipment_name)
            analysis = predictive_analysis_map[equipment_name]
            mock_predictive_tasks.append({
                'id': analysis['id'],
                'equipmentId': equipment['id'],
                'equipmentName': equipment['name'],
                'type': analysis['type'],
                'title': analysis['title'],
                'description': analysis['description'],
                'technicalAnalysis': analysis['technicalAnalysis'],
                'detailedAnalysis': analysis['detailedAnalysis'],
                'priority': analysis['priority'],
                'dueDate': analysis['dueDate'],
                'status': analysis['status'],
                'riskScore': int(clamp(round(100 - equipment['health'] + equipment['totalOccurrences'] * 6), 20, 95)),
                'estimatedCost': analysis['estimatedCost'],
            })

        ranking_seed = []
        for equipment in mock_equipment:
            if equipment['totalOccurrences'] <= 0:
                continue
            ranking_seed.append({
                'clientName': equipment['client'],
                'systemName': f"{equipment['area']} • {equipment['name']}",
                'totalAlarms': equipment['totalOccurrences'],
                'criticalAlarms': equipment['criticalOccurrences'],
                'healthScore': equipment['health'],
                'availability': equipment['availability'],
            })

        ranking_seed.sort(key=lambda item: (item['totalAlarms'], item['criticalAlarms'], -item['healthScore']), reverse=True)
        mock_system_rankings = []
        for idx, item in enumerate(ranking_seed, start=1):
            item['id'] = str(idx)
            item['rank'] = idx
            item['trend'] = 'down' if idx == 1 else 'stable' if idx == 2 else 'up'
            mock_system_rankings.append(item)

        top_three = mock_equipment[:3] if len(mock_equipment) >= 3 else mock_equipment
        mock_ieer_data = []
        for equipment in top_three:
            efficiency = round(clamp(equipment['performance'] * 1.02, 75, 115), 1)
            mock_ieer_data.append({
                'equipmentId': equipment['id'],
                'equipmentName': equipment['name'],
                'ieer': round(clamp(equipment['performance'] / 5.2, 12, 22), 1),
                'target': 18.0,
                'efficiency': efficiency,
                'lastUpdated': '2026-06-29',
            })

        mock_energy_data = [
            {'month': 'Jan/26', 'kwhConsumed': 12840, 'kwhCost': 1669.2, 'target': 13000, 'previousYear': 13950},
            {'month': 'Fev/26', 'kwhConsumed': 12410, 'kwhCost': 1613.3, 'target': 12800, 'previousYear': 13620},
            {'month': 'Mar/26', 'kwhConsumed': 13190, 'kwhCost': 1714.7, 'target': 12900, 'previousYear': 14110},
            {'month': 'Abr/26', 'kwhConsumed': 13640, 'kwhCost': 1773.2, 'target': 13200, 'previousYear': 14580},
            {'month': 'Mai/26', 'kwhConsumed': 12980, 'kwhCost': 1687.4, 'target': 13000, 'previousYear': 14040},
            {'month': 'Jun/26', 'kwhConsumed': 12620, 'kwhCost': 1640.6, 'target': 12900, 'previousYear': 13710},
        ]

        mock_water_data = [
            {'month': 'Jan/26', 'cubicMeters': 91, 'cost': 163.8, 'target': 95, 'previousYear': 102},
            {'month': 'Fev/26', 'cubicMeters': 88, 'cost': 158.4, 'target': 94, 'previousYear': 99},
            {'month': 'Mar/26', 'cubicMeters': 96, 'cost': 172.8, 'target': 95, 'previousYear': 105},
            {'month': 'Abr/26', 'cubicMeters': 93, 'cost': 167.4, 'target': 94, 'previousYear': 101},
            {'month': 'Mai/26', 'cubicMeters': 89, 'cost': 160.2, 'target': 92, 'previousYear': 97},
            {'month': 'Jun/26', 'cubicMeters': 87, 'cost': 156.6, 'target': 92, 'previousYear': 95},
        ]

        mock_health_trend = [
            {'month': 'Jan/26', 'health': 88, 'target': 90},
            {'month': 'Fev/26', 'health': 89, 'target': 90},
            {'month': 'Mar/26', 'health': 90, 'target': 90},
            {'month': 'Abr/26', 'health': 89, 'target': 90},
            {'month': 'Mai/26', 'health': 91, 'target': 90},
            {'month': 'Jun/26', 'health': 90, 'target': 90},
        ]

        mock_uptime_data = [
            {'month': 'Jan/26', 'availability': 93},
            {'month': 'Fev/26', 'availability': 94},
            {'month': 'Mar/26', 'availability': 95},
            {'month': 'Abr/26', 'availability': 94},
            {'month': 'Mai/26', 'availability': 95},
            {'month': 'Jun/26', 'availability': 95},
        ]

        sections = [
            "import {\n  Equipment,\n  WeeklyUpdate,\n  HealthTrendData,\n  UptimeData,\n  User,\n  Alarm,\n  PredictiveTask,\n  SystemRanking,\n  EnergyData,\n  IEERData,\n  WaterData\n} from '../types';",
            '',
            to_ts_export('mockUser', 'User', mock_user),
            '',
            to_ts_export('mockUsers', 'User[]', mock_users),
            '',
            to_ts_export('mockEquipment', 'Equipment[]', mock_equipment),
            '',
            to_ts_export('mockWeeklyUpdates', 'WeeklyUpdate[]', mock_weekly_updates),
            '',
            to_ts_export('mockAlarms', 'Alarm[]', mock_alarms),
            '',
            to_ts_export('mockPredictiveTasks', 'PredictiveTask[]', mock_predictive_tasks),
            '',
            to_ts_export('mockSystemRankings', 'SystemRanking[]', mock_system_rankings),
            '',
            to_ts_export('mockEnergyData', 'EnergyData[]', mock_energy_data),
            '',
            to_ts_export('mockIEERData', 'IEERData[]', mock_ieer_data),
            '',
            to_ts_export('mockWaterData', 'WaterData[]', mock_water_data),
            '',
            to_ts_export('mockHealthTrend', 'HealthTrendData[]', mock_health_trend),
            '',
            to_ts_export('mockUptimeData', 'UptimeData[]', mock_uptime_data),
            '',
        ]
        ts_content = '\n'.join(sections)

        output_path = os.path.join(base_path, 'src', 'lib', 'mockData.ts')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(ts_content)

        print(f'Arquivo mockData.ts gerado com sucesso em: {output_path}')
        print(f'Equipamentos carregados: {len(mock_equipment)}')
        print('Reinicie o servidor de desenvolvimento para ver as alteracoes.')

    except Exception:
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    csv_to_mock_data()
