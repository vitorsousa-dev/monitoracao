
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

random.seed(42)
np.random.seed(42)

# Generate DimData
def generate_dim_data(start_date, end_date):
    dates = pd.date_range(start=start_date, end=end_date)
    dim_data = pd.DataFrame({
        'DataKey': dates.strftime('%Y%m%d').astype(int),
        'Data': dates,
        'Ano': dates.year,
        'Mes': dates.month,
        'NomeMes': dates.strftime('%B'),
        'MesAno': dates.strftime('%m/%Y'),
        'Trimestre': dates.quarter,
        'Dia': dates.day,
        'DiaDaSemana': dates.dayofweek,
        'NomeDiaDaSemana': dates.strftime('%A'),
        'FimDeSemana': (dates.dayofweek >= 5).astype(int)
    })
    return dim_data

# Generate DimCliente
def generate_dim_cliente():
    clientes = [
        {'ClienteKey': 1, 'ClienteNome': 'Empresa ABC', 'Setor': 'Comercial'},
        {'ClienteKey': 2, 'ClienteNome': 'Hospital XYZ', 'Setor': 'Saude'},
        {'ClienteKey': 3, 'ClienteNome': 'Shopping Center', 'Setor': 'Varejo'},
        {'ClienteKey': 4, 'ClienteNome': 'Escola Publica', 'Setor': 'Educacao'},
        {'ClienteKey': 5, 'ClienteNome': 'Escritorio Corporativo', 'Setor': 'Servicos'}
    ]
    return pd.DataFrame(clientes)

# Generate DimContrato
def generate_dim_contrato(dim_cliente):
    contratos = []
    contrato_key = 1
    for cliente in dim_cliente.itertuples():
        contratos.append({
            'ContratoKey': contrato_key,
            'ClienteKey': cliente.ClienteKey,
            'ContratoNome': f'Contrato {cliente.ClienteNome}',
            'DataInicio': datetime(2023, 1, 1),
            'DataFim': datetime(2025, 12, 31),
            'SLADisponibilidade': 95.0,
            'SLAConforto': 90.0
        })
        contrato_key += 1
    return pd.DataFrame(contratos)

# Generate DimArea
def generate_dim_area(dim_contrato):
    areas = []
    area_key = 1
    area_nomes = ['Andar 1', 'Andar 2', 'Andar 3', 'Recepcao', 'Sala de Reunioes', 'Auditorio', 'Cozinha', 'Corredor']
    for contrato in dim_contrato.itertuples():
        for i in range(5):
            areas.append({
                'AreaKey': area_key,
                'ContratoKey': contrato.ContratoKey,
                'AreaNome': area_nomes[i],
                'AreaTipo': 'Escritorio' if i < 3 else 'Comum',
                'Capacidade': random.randint(20, 80)
            })
            area_key += 1
    return pd.DataFrame(areas)

# Generate DimEquipamento
def generate_dim_equipamento(dim_area):
    equipamentos = []
    equipamento_key = 1
    equipamento_tipos = ['VRV', 'Split', 'Cassete', 'Chiller']
    for area in dim_area.itertuples():
        for i in range(2):
            equipamentos.append({
                'EquipamentoKey': equipamento_key,
                'AreaKey': area.AreaKey,
                'EquipamentoNome': f'Equipamento {equipamento_key}',
                'EquipamentoTipo': random.choice(equipamento_tipos),
                'CapacidadeBTU': random.choice([9000, 12000, 18000, 24000]),
                'DataInstalacao': datetime(2021, 1, 1)
            })
            equipamento_key += 1
    return pd.DataFrame(equipamentos)

# Generate DimSLA
def generate_dim_sla():
    slas = [
        {'SLAKey': 1, 'SLANome': 'Disponibilidade', 'Meta': 95.0},
        {'SLAKey': 2, 'SLANome': 'Conforto', 'Meta': 90.0},
        {'SLAKey': 3, 'SLANome': 'MTTR', 'Meta': 4.0}
    ]
    return pd.DataFrame(slas)

# Generate FatoMonitoramento
def generate_fato_monitoramento(dim_data, dim_equipamento):
    fatos = []
    for data in dim_data.itertuples():
        for equipamento in dim_equipamento.itertuples():
            # Generate metrics with monthly trends
            month_factor = 0.95 + (data.Mes % 12) * 0.005
            
            disponibilidade = np.random.normal(96 * month_factor, 3)
            disponibilidade = min(100, max(80, disponibilidade))
            
            conforto = np.random.normal(92 * month_factor, 4)
            conforto = min(100, max(75, conforto))
            
            performance = np.random.normal(94 * month_factor, 3)
            performance = min(100, max(82, performance))
            
            saude = (disponibilidade * 0.35) + (conforto * 0.25) + (95 * 0.20) + (performance * 0.20)
            
            num_ocorrencias = random.randint(0, 2)
            ocorrencias_criticas = 1 if (random.random() < 0.03 and num_ocorrencias > 0) else 0
            ocorrencias_moderadas = random.randint(0, num_ocorrencias - ocorrencias_criticas)
            ocorrencias_informativas = num_ocorrencias - ocorrencias_criticas - ocorrencias_moderadas
            
            mttr = random.uniform(2, 6) if num_ocorrencias > 0 else 0
            
            temperatura_media = random.uniform(22, 26)
            setpoint = random.choice([23, 24, 25])
            
            fatos.append({
                'DataKey': data.DataKey,
                'EquipamentoKey': equipamento.EquipamentoKey,
                'AreaKey': equipamento.AreaKey,
                'Disponibilidade': disponibilidade,
                'Conforto': conforto,
                'Performance': performance,
                'Saude': saude,
                'OcorrenciasCriticas': ocorrencias_criticas,
                'OcorrenciasModeradas': ocorrencias_moderadas,
                'OcorrenciasInformativas': ocorrencias_informativas,
                'OcorrenciasTotal': num_ocorrencias,
                'MTTR': mttr,
                'TemperaturaMedia': temperatura_media,
                'Setpoint': setpoint,
                'TempoDentroConforto': random.uniform(85, 98)
            })
    
    return pd.DataFrame(fatos)

# Main execution
if __name__ == '__main__':
    print('Generating sample data...')
    
    # Date range: last 12 months
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    # Generate dimensions
    dim_data = generate_dim_data(start_date, end_date)
    dim_cliente = generate_dim_cliente()
    dim_contrato = generate_dim_contrato(dim_cliente)
    dim_area = generate_dim_area(dim_contrato)
    dim_equipamento = generate_dim_equipamento(dim_area)
    dim_sla = generate_dim_sla()
    
    # Generate fact table
    fato_monitoramento = generate_fato_monitoramento(dim_data, dim_equipamento)
    
    # Save to CSV
    dim_data.to_csv('data/DimData.csv', index=False, sep=';', encoding='utf-8-sig')
    dim_cliente.to_csv('data/DimCliente.csv', index=False, sep=';', encoding='utf-8-sig')
    dim_contrato.to_csv('data/DimContrato.csv', index=False, sep=';', encoding='utf-8-sig')
    dim_area.to_csv('data/DimArea.csv', index=False, sep=';', encoding='utf-8-sig')
    dim_equipamento.to_csv('data/DimEquipamento.csv', index=False, sep=';', encoding='utf-8-sig')
    dim_sla.to_csv('data/DimSLA.csv', index=False, sep=';', encoding='utf-8-sig')
    fato_monitoramento.to_csv('data/FatoMonitoramento.csv', index=False, sep=';', encoding='utf-8-sig')
    
    print('Data generation completed!')
    print(f'FatoMonitoramento: {len(fato_monitoramento)} records')
    print(f'DimData: {len(dim_data)} records')
    print(f'DimCliente: {len(dim_cliente)} records')
    print(f'DimContrato: {len(dim_contrato)} records')
    print(f'DimArea: {len(dim_area)} records')
    print(f'DimEquipamento: {len(dim_equipamento)} records')
    print(f'DimSLA: {len(dim_sla)} records')
