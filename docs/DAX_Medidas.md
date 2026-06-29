
# Medidas DAX - Dashboard HVAC/VRV

## Medidas Principais

### SaudeSistema
```dax
SaudeSistema = 
VAR DisponibilidadePeso = [Disponibilidade] * 0.35
VAR ConfortoPeso = [Conforto] * 0.25
VAR SLAPeso = 95 * 0.20
VAR PerformancePeso = [Performance] * 0.20
RETURN
DisponibilidadePeso + ConfortoPeso + SLAPeso + PerformancePeso
```

### Disponibilidade
```dax
Disponibilidade = AVERAGE(FatoMonitoramento[Disponibilidade])
```

### Conforto
```dax
Conforto = AVERAGE(FatoMonitoramento[Conforto])
```

### Performance
```dax
Performance = AVERAGE(FatoMonitoramento[Performance])
```

### MTTR
```dax
MTTR = AVERAGE(FatoMonitoramento[MTTR])
```

## Medidas de Ocorrências

### OcorrenciasCriticas
```dax
OcorrenciasCriticas = SUM(FatoMonitoramento[OcorrenciasCriticas])
```

### OcorrenciasModeradas
```dax
OcorrenciasModeradas = SUM(FatoMonitoramento[OcorrenciasModeradas])
```

### OcorrenciasInformativas
```dax
OcorrenciasInformativas = SUM(FatoMonitoramento[OcorrenciasInformativas])
```

### OcorrenciasTotal
```dax
OcorrenciasTotal = SUM(FatoMonitoramento[OcorrenciasTotal])
```

## Medidas Comparativas

### DisponibilidadeMesAnterior
```dax
DisponibilidadeMesAnterior = 
CALCULATE(
    [Disponibilidade],
    DATEADD(DimData[Data], -1, MONTH)
)
```

### SaudeMesAnterior
```dax
SaudeMesAnterior = 
CALCULATE(
    [SaudeSistema],
    DATEADD(DimData[Data], -1, MONTH)
)
```

### TendenciaDisponibilidade
```dax
TendenciaDisponibilidade = 
VAR Atual = [Disponibilidade]
VAR Anterior = [DisponibilidadeMesAnterior]
RETURN
Atual - Anterior
```

## Medidas de Status

### StatusSaude
```dax
StatusSaude = 
SWITCH(
    TRUE(),
    [SaudeSistema] >= 90, "Verde",
    [SaudeSistema] >= 80, "Amarelo",
    "Vermelho"
)
```

### StatusDisponibilidade
```dax
StatusDisponibilidade = 
IF(
    [Disponibilidade] >= 95,
    "Dentro do SLA",
    "Fora do SLA"
)
```

## Medidas de Equipamentos

### EquipamentosTotal
```dax
EquipamentosTotal = DISTINCTCOUNT(FatoMonitoramento[EquipamentoKey])
```

### EquipamentosSaudaveis
```dax
EquipamentosSaudaveis = 
CALCULATE(
    DISTINCTCOUNT(FatoMonitoramento[EquipamentoKey]),
    FatoMonitoramento[Saude] >= 90
)
```

### EquipamentosSaudaveisTexto
```dax
EquipamentosSaudaveisTexto = 
[EquipamentosSaudaveis] & " / " & [EquipamentosTotal]
```

## Medidas de Conforto

### TempoDentroConforto
```dax
TempoDentroConforto = AVERAGE(FatoMonitoramento[TempoDentroConforto])
```

### TemperaturaMedia
```dax
TemperaturaMedia = AVERAGE(FatoMonitoramento[TemperaturaMedia])
```

## Medidas de Rankeamento

### Top10AreasMaisOcorrencias
```dax
Top10AreasMaisOcorrencias = 
RANKX(
    ALL(DimArea[AreaNome]),
    [OcorrenciasTotal],
    ,
    DESC,
    Skip
)
```

### Top10AreasMelhorDisponibilidade
```dax
Top10AreasMelhorDisponibilidade = 
RANKX(
    ALL(DimArea[AreaNome]),
    [Disponibilidade],
    ,
    DESC,
    Skip
)
```
