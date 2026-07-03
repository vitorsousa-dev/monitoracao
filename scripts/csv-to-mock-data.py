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
23/06/26 16:10 | 23/06/26 17:15 | R24.13-REUNIÃO 13 (010) | Midea_7 | 4# | High
23/06/26 14:35 | 23/06/26 14:45 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
23/06/26 14:05 | 23/06/26 14:20 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
22/06/26 20:00 | 22/06/26 20:15 | R24.14-REUNIÃO 14 (011) | Midea_7 | P0 | High
17/06/26 17:15 | 17/06/26 17:30 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
15/06/26 21:50 | 15/06/26 22:00 | R24.10-BLUMENAU (042) | Midea_4 | P0 | High
11/6/2026 12:45 | 11/6/2026 13:00 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
11/6/2026 12:05 | 11/6/2026 12:20 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
11/6/2026 11:30 | 11/6/2026 11:50 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
11/6/2026 10:55 | 11/6/2026 11:10 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
10/6/2026 17:45 | 10/6/2026 18:00 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
10/6/2026 17:45 | 10/6/2026 18:00 | R24.14-REUNIÃO 14 (011) | Midea_7 | P0 | High
10/6/2026 16:40 | 10/6/2026 16:55 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
10/6/2026 16:40 | 10/6/2026 16:50 | R24.14-REUNIÃO 14 (011) | Midea_7 | P0 | High
3/6/2026 16:20 | 3/6/2026 16:35 | R24.14-REUNIÃO 14 (011) | Midea_7 | P0 | High
3/6/2026 15:45 | 3/6/2026 16:00 | R24.14-REUNIÃO 14 (011) | Midea_7 | P0 | High
3/6/2026 15:20 | 3/6/2026 15:30 | R24.14-REUNIÃO 14 (011) | Midea_7 | P0 | High
3/6/2026 14:45 | 3/6/2026 14:55 | R24.14-REUNIÃO 14 (011) | Midea_7 | P0 | High
3/6/2026 14:20 | 3/6/2026 14:30 | R24.14-REUNIÃO 14 (011) | Midea_7 | P0 | High
2/6/2026 13:10 | 2/6/2026 13:25 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
2/6/2026 12:30 | 2/6/2026 12:45 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
2/6/2026 12:00 | 2/6/2026 12:15 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
2/6/2026 11:30 | 2/6/2026 11:40 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
2/6/2026 11:05 | 2/6/2026 11:15 | R24.13-REUNIÃO 13 (010) | Midea_7 | P0 | High
""".strip()


def parse_datetime_flexible(value):
    value = value.strip()
    for fmt in ('%d/%m/%y %H:%M', '%d/%m/%Y %H:%M'):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    raise ValueError(f'Data invalida: {value}')


def parse_alarm_logs(raw_text):
    alarm_events = []
    for line in raw_text.splitlines():
        parts = [part.strip() for part in line.split('|')]
        if len(parts) != 6:
            continue

        first_col, second_col, third_col, fourth_col, alarm_code, severity = parts

        if any(char.isdigit() for char in second_col[:2]) and '/' in second_col and ':' in second_col:
            alarm_dt = parse_datetime_flexible(first_col)
            close_dt = parse_datetime_flexible(second_col)
            equipment_name = third_col.rsplit('(', 1)[0].strip()
            client_name = 'Serasa Experian'
            system_name = fourth_col.strip().lower()
        else:
            alarm_dt = parse_datetime_flexible(first_col)
            close_dt = alarm_dt
            equipment_name = second_col.rsplit('(', 1)[0].strip()
            client_name = third_col.split(' - ')[0].strip()
            system_name = fourth_col.strip().lower()

        alarm_events.append({
            'timestamp': alarm_dt,
            'closeTimestamp': close_dt,
            'timestampRaw': first_col,
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


def month_label_from_key(month_key):
    year, month = month_key.split('-')
    month_names = {
        '01': 'Jan',
        '02': 'Fev',
        '03': 'Mar',
        '04': 'Abr',
        '05': 'Mai',
        '06': 'Jun',
        '07': 'Jul',
        '08': 'Ago',
        '09': 'Set',
        '10': 'Out',
        '11': 'Nov',
        '12': 'Dez',
    }
    return f"{month_names[month]}/{year[-2:]}"


def availability_penalty(total):
    return min(18, total * 0.35)


def comfort_penalty(total):
    return min(22, total * 0.45)


def performance_penalty(total):
    return min(16, total * 0.30)


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
        equipment_profiles = []
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
            base_availability = round(clamp(availability + availability_penalty(alarm_total), 70, 99.5), 2)
            base_comfort = round(clamp(comfort + comfort_penalty(alarm_total), 68, 98.0), 2)
            base_performance = round(clamp(performance + performance_penalty(alarm_total), 70, 99.0), 2)

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
            equipment_profiles.append({
                'id': str(eq_key),
                'name': equipment_name,
                'type': str(eq_row['EquipamentoTipo']),
                'area': str(area_row['AreaNome']),
                'client': str(cliente_row['ClienteNome']),
                'baseAvailability': base_availability,
                'baseComfort': base_comfort,
                'basePerformance': base_performance,
                'lastUpdated': format_date_key(fato_row['DataKey']),
            })

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
                'content': f'Foram incorporados {len(alarm_events)} registros reais de alarmes disponiveis na base para o cliente {client_name}, com destaque para os equipamentos mais reincidentes.',
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
                'updatedAt': alarm['closeTimestamp'].strftime('%Y-%m-%d %H:%M'),
                'clientName': alarm['clientName'],
                'areaName': alarm['systemName'],
                'hasFollowup': followup_count > 1,
                'followupCount': followup_count if is_latest_alarm else max(followup_count - 1, 0),
            })

        monthly_alarm_groups = {}
        for alarm in alarm_events:
            month_key = alarm['timestamp'].strftime('%Y-%m')
            monthly_alarm_groups.setdefault(month_key, []).append(alarm)

        mock_monthly_summaries = []
        mock_monthly_equipment_snapshots = []
        for month_key in sorted(monthly_alarm_groups.keys()):
            month_alarms = monthly_alarm_groups[month_key]
            start_date = min(alarm['timestamp'] for alarm in month_alarms).strftime('%Y-%m-%d')
            end_date = max(alarm['timestamp'] for alarm in month_alarms).strftime('%Y-%m-%d')
            counts_by_equipment = {}
            for alarm in month_alarms:
                counts_by_equipment[alarm['equipmentName']] = counts_by_equipment.get(alarm['equipmentName'], 0) + 1

            month_snapshots = []
            for profile in equipment_profiles:
                monthly_occurrences = counts_by_equipment.get(profile['name'], 0)
                monthly_availability = round(clamp(profile['baseAvailability'] - availability_penalty(monthly_occurrences), 70, 99.5), 2)
                monthly_comfort = round(clamp(profile['baseComfort'] - comfort_penalty(monthly_occurrences), 68, 98.0), 2)
                monthly_performance = round(clamp(profile['basePerformance'] - performance_penalty(monthly_occurrences), 70, 99.0), 2)
                monthly_health = round((monthly_availability * 0.35) + (monthly_comfort * 0.25) + (95 * 0.20) + (monthly_performance * 0.20), 2)
                monthly_mttr = round(min(24.0, 2.5 + (monthly_occurrences * 0.35)), 2) if monthly_occurrences > 0 else 0.0
                snapshot = {
                    'id': profile['id'],
                    'name': profile['name'],
                    'type': profile['type'],
                    'area': profile['area'],
                    'client': profile['client'],
                    'health': monthly_health,
                    'availability': monthly_availability,
                    'comfort': monthly_comfort,
                    'performance': monthly_performance,
                    'status': build_status(monthly_health),
                    'mttr': monthly_mttr,
                    'totalOccurrences': monthly_occurrences,
                    'criticalOccurrences': monthly_occurrences,
                    'moderateOccurrences': 0,
                    'informativeOccurrences': 0,
                    'lastUpdated': end_date,
                    'monthKey': month_key,
                    'month': month_label_from_key(month_key),
                    'startDate': start_date,
                    'endDate': end_date,
                }
                month_snapshots.append(snapshot)

            affected_snapshots = [snapshot for snapshot in month_snapshots if snapshot['totalOccurrences'] > 0]
            affected_count = len(affected_snapshots)
            if affected_count == 0:
                affected_snapshots = month_snapshots
                affected_count = len(month_snapshots)

            mock_monthly_summaries.append({
                'monthKey': month_key,
                'month': month_label_from_key(month_key),
                'startDate': start_date,
                'endDate': end_date,
                'health': round(sum(item['health'] for item in affected_snapshots) / affected_count, 2),
                'target': 90,
                'availability': round(sum(item['availability'] for item in affected_snapshots) / affected_count, 2),
                'mttr': round(sum(item['mttr'] for item in affected_snapshots) / affected_count, 2),
                'totalOccurrences': sum(item['totalOccurrences'] for item in affected_snapshots),
                'affectedEquipment': affected_count,
            })
            mock_monthly_equipment_snapshots.extend(month_snapshots)

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

        mock_ieer_data = []

        mock_energy_data = []

        mock_water_data = []

        mock_health_trend = [
            {'month': item['month'], 'health': item['health'], 'target': item['target']}
            for item in mock_monthly_summaries
        ]

        mock_uptime_data = [
            {'month': item['month'], 'availability': item['availability']}
            for item in mock_monthly_summaries
        ]

        sections = [
            "import {\n  Equipment,\n  WeeklyUpdate,\n  HealthTrendData,\n  UptimeData,\n  User,\n  Alarm,\n  PredictiveTask,\n  SystemRanking,\n  EnergyData,\n  IEERData,\n  WaterData,\n  MonthlySummary,\n  EquipmentMonthlySnapshot\n} from '../types';",
            '',
            to_ts_export('mockUser', 'User', mock_user),
            '',
            to_ts_export('mockUsers', 'User[]', mock_users),
            '',
            to_ts_export('mockEquipment', 'Equipment[]', mock_equipment),
            '',
            to_ts_export('mockMonthlySummaries', 'MonthlySummary[]', mock_monthly_summaries),
            '',
            to_ts_export('mockMonthlyEquipmentSnapshots', 'EquipmentMonthlySnapshot[]', mock_monthly_equipment_snapshots),
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
