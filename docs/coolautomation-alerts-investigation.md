# Investigação — Origem dos Alertas e Logs CoolAutomation

## Status atual

A documentação fornecida (`CoolAutomation-REST-API-spec.pdf`) descreve **apenas**:
- **API V1**: execução de comandos ASCII_IF via `GET /v1.0/device/{SN}/raw?command={CMD}`
- **API V2**: consulta de estado das unidades via `GET /v2.0/device/{SN}/ls2` e `ls2&{UID}`

Os campos retornados (`uid`, `onoff`, `st`, `rt`, `fspeed`, `mode`, `fls`, `filt`, `dmnd`) representam o **estado atual** das unidades internas. O campo `fls` (ou `flr` no exemplo) contém o **código de falha atual**, não um histórico.

## Perguntas em aberto (requerem documentação/adicional)

1. **Histórico de alarmes locais**: Não foi identificado comando ASCII_IF documentado para recuperar histórico de eventos (ex: `alarm log`, `history`, `evtlog`). A documentação fornecida não lista comandos de leitura de log.
2. **CoolRemote Cloud API**: O portal CoolRemote pode disponibilizar uma API em nuvem separada, com autenticação própria (não documentada aqui).
3. **WebSocket/notificações**: Não há menção a WebSocket na documentação fornecida.
4. **Licenciamento**: Dados históricos podem exigir licença específica do dispositivo.

## Recomendação

Antes de implementar a sincronização real de alertas:
1. Solicitar à CoolAutomation a documentação de **comandos ASCII_IF completos** (especialmente logs de alarme).
2. Confirmar se existe uma **API do CoolRemote Cloud** com histórico de eventos.
3. Verificar se o dispositivo suporta `syslog` ou `SNMP traps` para encaminhamento de alarmes em tempo real.

## Diferença crítica

- **Código de falha atual (`fls`)**: estado do equipamento no momento da consulta.
- **Histórico de alarmes**: registros de eventos passados com timestamp. A documentação atual **não comprova** o acesso a esse histórico.
