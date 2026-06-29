
# Dashboard Power BI Corporativo - Monitoramento HVAC/VRV

Dashboard executivo em Power BI para traduzir dados de monitoramento HVAC/VRV em indicadores claros de saude operacional, risco e desempenho, com leitura rapida para gestores em menos de 60 segundos.

## Estrutura do Projeto

```
relatorio_monitoracao/
├── data/                    # Dados de exemplo (CSV)
│   ├── DimArea.csv
│   ├── DimCliente.csv
│   ├── DimContrato.csv
│   ├── DimData.csv
│   ├── DimEquipamento.csv
│   ├── DimSLA.csv
│   └── FatoMonitoramento.csv
├── scripts/                 # Scripts Python
│   └── generate_sample_data.py
├── docs/                    # Documentacao
│   └── DAX_Medidas.md
└── README.md
```

## Modelo de Dados (Star Schema)

### Tabelas de Dimensao
- **DimData**: Calendario completo com hierarquia Ano -> Mes -> Dia
- **DimCliente**: Clientes e seus setores
- **DimContrato**: Contratos e metas de SLA
- **DimArea**: Areas/ambientes monitorados
- **DimEquipamento**: Equipamentos HVAC/VRV
- **DimSLA**: Metas de SLA

### Tabela de Fato
- **FatoMonitoramento**: Dados de monitoramento diario por equipamento

## Como Usar

### 1. Gerar Dados de Exemplo
```bash
pip install pandas numpy
python scripts/generate_sample_data.py
```

### 2. Criar Dashboard no Power BI
1. Abra o Power BI Desktop
2. Importe os arquivos CSV da pasta `data/`
3. Crie as relacoes entre as tabelas conforme o modelo estrela
4. Implemente as medidas DAX (veja `docs/DAX_Medidas.md`)
5. Crie as 5 paginas do dashboard

## Paginas do Dashboard

1. **Visao Executiva**: KPIs principais e status geral
2. **Evolucao Mensal**: Tendencia de saude, disponibilidade e ocorrencias
3. **Conforto e Experiencia**: Impacto no conforto por area
4. **Insights Automáticos**: Insights em linguagem natural e rankings
5. **Visao Operacional**: Detalhes por cliente, contrato e area

## Paleta de Cores

- Verde: #00B050
- Amarelo: #FFC000
- Vermelho: #E53935
- Cinza: #6C757D
- Azul: #0F6CBD

## Regras de Negocio

### Saude do Sistema
- 90-100%: Verde (Saudavel)
- 80-89%: Amarelo (Atencao)
- 0-79%: Vermelho (Critico)

### Formula de Calculo
```
Saude = (Disponibilidade * 0.35) + (Conforto * 0.25) + (SLA * 0.20) + (Performance * 0.20)
```
