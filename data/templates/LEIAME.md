# Templates CSV para Dados do Dashboard

Esta pasta contém templates para você poder alterar os dados do dashboard de monitoramento HVAC/VRV.

## Estrutura dos Arquivos

Os dados seguem um **modelo estrela (star schema)**:

### Tabelas de Dimensão
- `DimCliente_TEMPLATE.csv` - Clientes e setores
- `DimContrato_TEMPLATE.csv` - Contratos e metas SLA
- `DimArea_TEMPLATE.csv` - Áreas/ambientes monitorados
- `DimEquipamento_TEMPLATE.csv` - Equipamentos HVAC/VRV
- `DimData_TEMPLATE.csv` - Calendário (dimensão temporal)
- `DimSLA_TEMPLATE.csv` - Metas de nível de serviço

### Tabela de Fato
- `FatoMonitoramento_TEMPLATE.csv` - Dados de monitoramento diários

## Como Usar

### 1. Editar os Templates
Abra os arquivos CSV em um editor de texto ou planilha (Excel, Google Sheets, LibreOffice Calc) e altere os dados conforme necessário.

### 2. Importar para Power BI
1. Abra o Power BI Desktop
2. Vá para **Obter Dados > Arquivo de Texto/CSV**
3. Selecione o arquivo CSV editado
4. Verifique se o delimitador está configurado como **Ponto e vírgula (;)**
5. Repita para todas as tabelas

### 3. Criar Relacionamentos
No Power BI, crie as seguintes relações entre as tabelas:
- `FatoMonitoramento[DataKey]` → `DimData[DataKey]`
- `FatoMonitoramento[EquipamentoKey]` → `DimEquipamento[EquipamentoKey]`
- `FatoMonitoramento[AreaKey]` → `DimArea[AreaKey]`
- `DimArea[ContratoKey]` → `DimContrato[ContratoKey]`
- `DimContrato[ClienteKey]` → `DimCliente[ClienteKey]`

## Descrição dos Campos

### DimCliente
- `ClienteKey`: ID único do cliente (chave primária)
- `ClienteNome`: Nome do cliente
- `Setor`: Setor de atividade (Comercial, Saúde, Varejo, etc.)

### DimContrato
- `ContratoKey`: ID único do contrato (chave primária)
- `ClienteKey`: Relacionamento com DimCliente
- `ContratoNome`: Nome/descrição do contrato
- `DataInicio`: Data de início do contrato
- `DataFim`: Data de término do contrato
- `SLADisponibilidade`: Meta de disponibilidade (%)
- `SLAConforto`: Meta de conforto (%)

### DimArea
- `AreaKey`: ID único da área (chave primária)
- `ContratoKey`: Relacionamento com DimContrato
- `AreaNome`: Nome da área (Andar 1, Recepção, etc.)
- `AreaTipo`: Tipo de área (Escritório, Comum, Comercial, etc.)
- `Capacidade`: Capacidade de pessoas

### DimEquipamento
- `EquipamentoKey`: ID único do equipamento (chave primária)
- `AreaKey`: Relacionamento com DimArea
- `EquipamentoNome`: Nome/identificação do equipamento
- `EquipamentoTipo`: Tipo (VRV, Split, Cassete, Chiller)
- `CapacidadeBTU`: Capacidade em BTUs
- `DataInstalacao`: Data de instalação

### DimData
- `DataKey`: ID único da data no formato AAAAMMDD
- `Data`: Data completa
- `Ano`: Ano
- `Mes`: Mês (número)
- `NomeMes`: Nome do mês
- `MesAno`: Mês/Ano
- `Trimestre`: Trimestre (1-4)
- `Dia`: Dia do mês
- `DiaDaSemana`: Dia da semana (0=Seg, 6=Dom)
- `NomeDiaDaSemana`: Nome do dia da semana
- `FimDeSemana`: 1=Fim de semana, 0=Dia útil

### DimSLA
- `SLAKey`: ID único da meta (chave primária)
- `SLANome`: Nome da meta (Disponibilidade, Conforto, MTTR)
- `Meta`: Valor da meta

### FatoMonitoramento
- `DataKey`: Relacionamento com DimData
- `EquipamentoKey`: Relacionamento com DimEquipamento
- `AreaKey`: Relacionamento com DimArea
- `Disponibilidade`: Índice de disponibilidade (%)
- `Conforto`: Índice de conforto (%)
- `Performance`: Índice de performance (%)
- `Saude`: Saúde geral do sistema (%) - calculada como:
  - Disponibilidade × 35% +
  - Conforto × 25% +
  - SLA (95%) × 20% +
  - Performance × 20%
- `OcorrenciasCriticas`: Número de ocorrências críticas
- `OcorrenciasModeradas`: Número de ocorrências moderadas
- `OcorrenciasInformativas`: Número de ocorrências informativas
- `OcorrenciasTotal`: Total de ocorrências
- `MTTR`: Tempo médio de resolução (horas)
- `TemperaturaMedia`: Temperatura média registrada
- `Setpoint`: Temperatura programada
- `TempoDentroConforto`: Tempo dentro dos limites de conforto (%)

## Dicas Importantes

1. **Mantenha as Chaves**: Não altere os valores das chaves (Campos terminados em Key) a menos que saiba o que está fazendo
2. **Delimitador**: Use sempre ponto e vírgula (;) como delimitador
3. **Encoding**: Salve os arquivos em UTF-8 com BOM para manter acentos
4. **Atualização**: Ao atualizar os dados, substitua os arquivos originais na pasta `data/`
5. **Backup**: Sempre faça backup antes de substituir os dados

## Atualizando Dados na Aplicação React

Para usar os dados CSV na aplicação React, você precisaria integrar um backend ou importar diretamente os dados. Os templates são principalmente para uso no Power BI.
