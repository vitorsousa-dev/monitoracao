import pandas as pd
import os
import sys

# Configurar UTF-8 para saida
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def csv_to_mock_data():
    """
    Converte os arquivos CSV para o arquivo mockData.ts usado na aplicacao React.
    """
    print("Convertendo CSV para dados mock...")
    
    # Caminhos dos arquivos
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_path, 'data')
    
    try:
        # Ler todos os CSVs
        df_clientes = pd.read_csv(os.path.join(data_path, 'DimCliente.csv'), sep=';', encoding='utf-8-sig')
        df_contratos = pd.read_csv(os.path.join(data_path, 'DimContrato.csv'), sep=';', encoding='utf-8-sig')
        df_areas = pd.read_csv(os.path.join(data_path, 'DimArea.csv'), sep=';', encoding='utf-8-sig')
        df_equipamentos = pd.read_csv(os.path.join(data_path, 'DimEquipamento.csv'), sep=';', encoding='utf-8-sig')
        df_fato = pd.read_csv(os.path.join(data_path, 'FatoMonitoramento.csv'), sep=';', encoding='utf-8-sig')
        
        # Criar dicionarios para lookup rapido
        clientes = {row['ClienteKey']: row for _, row in df_clientes.iterrows()}
        contratos = {row['ContratoKey']: row for _, row in df_contratos.iterrows()}
        areas = {row['AreaKey']: row for _, row in df_areas.iterrows()}
        
        # Obter ultimos dados para cada equipamento
        equipamentos_dict = {}
        for _, row in df_fato.iterrows():
            eq_key = row['EquipamentoKey']
            dk = row['DataKey']
            if eq_key not in equipamentos_dict or equipamentos_dict[eq_key]['DataKey'] < dk:
                equipamentos_dict[eq_key] = row
        
        # Gerar o mockData.ts
        ts_content = '''import { Equipment, WeeklyUpdate, HealthTrendData, UptimeData, User } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Joao Silva',
  email: 'joao.silva@empresa.com',
  role: 'manager'
};

export const mockEquipment: Equipment[] = [
'''
        
        for eq_key, fato_row in equipamentos_dict.items():
            # Encontrar o equipamento na dimensao
            eq_row = df_equipamentos[df_equipamentos['EquipamentoKey'] == eq_key].iloc[0]
            area_key = eq_row['AreaKey']
            area_row = areas.get(area_key)
            contrato_key = area_row['ContratoKey']
            contrato_row = contratos.get(contrato_key)
            cliente_row = clientes.get(contrato_row['ClienteKey'])
            
            saude = float(fato_row['Saude'])
            if saude >= 90:
                status = 'Verde'
            elif saude >= 80:
                status = 'Amarelo'
            else:
                status = 'Vermelho'
            
            ts_content += f'''  {{
    id: '{int(eq_key)}',
    name: '{eq_row['EquipamentoNome']}',
    type: '{eq_row['EquipamentoTipo']}',
    area: '{area_row['AreaNome']}',
    client: '{cliente_row['ClienteNome']}',
    health: {float(fato_row['Saude'])},
    availability: {float(fato_row['Disponibilidade'])},
    comfort: {float(fato_row['Conforto'])},
    performance: {float(fato_row['Performance'])},
    status: '{status}',
    mttr: {float(fato_row['MTTR'])},
    totalOccurrences: {int(fato_row['OcorrenciasTotal'])},
    criticalOccurrences: {int(fato_row['OcorrenciasCriticas'])},
    moderateOccurrences: {int(fato_row['OcorrenciasModeradas'])},
    informativeOccurrences: {int(fato_row['OcorrenciasInformativas'])},
    lastUpdated: '{str(fato_row['DataKey'])[:4]}-{str(fato_row['DataKey'])[4:6]}-{str(fato_row['DataKey'])[6:]}'
  }},
'''
        
        ts_content += '''];

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
'''
        
        # Salvar arquivo
        output_path = os.path.join(base_path, 'src', 'lib', 'mockData.ts')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(ts_content)
        
        print(f"Arquivo mockData.ts gerado com sucesso em: {output_path}")
        print("Reinicie o servidor de desenvolvimento para ver as alteracoes.")
        
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    csv_to_mock_data()
