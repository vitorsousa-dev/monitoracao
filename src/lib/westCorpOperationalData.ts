import { Alarm, EquipmentMonthlySnapshot, MonthlySummary, SiteMonthlySnapshot } from '@/types'
import { WEST_CORP_CLIENT, WEST_CORP_SITE_ID, WEST_CORP_SITE_NAME, westCorpSite, westCorpSystems } from './westCorpData'
import { getHealthStatusText } from './utils'

type RawWestCorpLog = {
  date: string
  time: string
  unitName: string
  systemName: string
  description: string
  errorCode: string
  errorDescription: string
  alertType: string
  priority: 'High' | 'Medium' | 'Low'
}

export interface WestCorpUnitHealthRollup {
  id: string
  unitName: string
  systemId: string
  systemName: string
  unitType: 'ODU' | 'IDU' | 'SYSTEM'
  totalAlerts: number
  health: number
  availability: number
  mttr: number
  status: 'Verde' | 'Amarelo' | 'Vermelho'
  lastAlertAt: string
}

const RAW_LOG_LINES = `
30/05/26   22:39 6P-D-MAIN 06P-D_1 Outdoor error 116 Outdoor Error High
30/05/26   22:37 6P-D-MAIN 06P-D_1 Outdoor error 21 Outdoor Error High
30/05/26   17:15 NOBREAK_4P-C (035) 04P-C_7 Indoor error 10 Indoor unit BLDC fan motor communications error. Indoor Error High
30/05/26   17:05 6P-D-MAIN 06P-D_1 Outdoor error 116 Outdoor Error High
30/06/26   23:45 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
30/06/26   23:43 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
30/06/26   22:13 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
30/06/26   20:27 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
30/06/26   18:01 ENEL 5_5P-C (040) 05P-C_9 Indoor error 42 Indoor Error High
30/06/26   18:01 ENEL 7_5P-C (041) 05P-C_9 Indoor error 42 Indoor Error High
30/06/26   18:01 ENEL 4_5P-C (042) 05P-C_9 Indoor error 42 Indoor Error High
30/06/26   18:01 ENEL 6_5P-C (043) 05P-C_9 Indoor error 42 Indoor Error High
30/06/26   18:01 ENEL 3_5P-C (044) 05P-C_9 Indoor error 42 Indoor Error High
30/06/26   18:01 WC MASC_5P-C (045) 05P-C_9 Indoor error 42 Indoor Error High
30/06/26   18:01 ENEL 1_5P-C (046) 05P-C_9 Indoor error 42 Indoor Error High
30/06/26   18:01 ENEL 2_5P-C (047) 05P-C_9 Indoor error 42 Indoor Error High
30/06/26   17:28 ODU L6.900.1235 05P-C_9 Outdoor error 42 Outdoor Error High
30/06/26   16:45 ODU L6.C00.1235 07P-A_C(12) Outdoor error 21 Outdoor Error High
30/06/26   13:09 6P-D-MAIN 06P-D_1 Outdoor error 77 Outdoor Error High
30/06/26   12:05 ODU L4.800.1235 13P-A_4_8 Outdoor error 21 Outdoor Error High
30/06/26   11:05 ODU L6.400.0D80 11P-B_4 Outdoor error 21 Outdoor Error High
30/06/26   10:09 multiple 05P-C_9 Units disconnected Units disconnected High
30/06/26   10:09 multiple 05P-C_9 Units disconnected Units disconnected High
30/06/26   09:19 ODU L6.900.1235 05P-C_9 Outdoor error 53 Outdoor Error High
30/06/26   06:11 ODU L4.600.0D80 03P-D_6 Outdoor error 26 Outdoor Error High
30/06/26   05:35 NOBREAK_4P-C (035) 04P-C_7 Indoor error 10 Indoor unit BLDC fan motor communications error. Indoor Error High
30/06/26   00:40 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
30/06/26   00:00 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
29/06/26   22:10 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
29/06/26   18:05 ODU L6.B00.1235 06P-C_B(11) Outdoor error 53 Outdoor Error High
29/06/26   17:09 6P-D-MAIN 06P-D_1 Outdoor error 77 Outdoor Error High
29/06/26   15:12 6P-D-MAIN 06P-D_1 Outdoor error 116 Outdoor Error High
29/06/26   14:17 6P-D-MAIN 06P-D_1 Outdoor error 77 Outdoor Error High
29/06/26   13:25 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
29/06/26   12:01 L4.0A0.0166_11P-C (0A0) 11P-C_4_5 Indoor error 53 Indoor Error High
29/06/26   12:01 L4.0A2.0166_11P-C (0A2) 11P-C_4_5 Indoor error 53 Indoor Error High
29/06/26   12:01 L4.0A3.0166_11P-C (0A3) 11P-C_4_5 Indoor error 53 Indoor Error High
29/06/26   12:01 L4.0A5.0166_11P-C (0A5) 11P-C_4_5 Indoor error 53 Indoor Error High
29/06/26   11:57 11P-C_MAIN 11P-C_4_5 Outdoor error 53 Outdoor Error High
29/06/26   11:30 05_11P-B (094) 11P-B_4 Indoor error 151 Indoor Error High
29/06/26   11:30 08_11P-B (097) 11P-B_4 Indoor error 151 Indoor Error High
29/06/26   11:30 02_11P-B (091) 11P-B_4 Indoor error 151 Indoor Error High
29/06/26   11:30 03_11P-B (092) 11P-B_4 Indoor error 151 Indoor Error High
29/06/26   11:30 07_11P-B (096) 11P-B_4 Indoor error 151 Indoor Error High
29/06/26   11:30 01_11P-B (090) 11P-B_4 Indoor error 151 Indoor Error High
29/06/26   11:30 04_11P-B (093) 11P-B_4 Indoor error 151 Indoor Error High
29/06/26   11:30 06_11P-B (095) 11P-B_4 Indoor error 151 Indoor Error High
29/06/26   11:30 ODU L6.400.0D80 11P-B_4 Outdoor error 151 Outdoor Error High
29/06/26   10:04 ODU L4.F00.1235 16P-C_4_F Outdoor error 21 Outdoor Error High
29/06/26   05:40 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
29/06/26   03:35 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
29/06/26   03:15 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
28/06/26   17:08 ODU L4.700.0D80 03P-B_7 Outdoor error 21 Outdoor Error High
28/06/26   16:35 01_6P-C (050) 06P-C_B(11) Indoor error 53 Indoor Error High
28/06/26   16:35 02_6P-C (051) 06P-C_B(11) Indoor error 53 Indoor Error High
28/06/26   16:35 04_6P-C (053) 06P-C_B(11) Indoor error 53 Indoor Error High
28/06/26   16:35 05_6P-C (054) 06P-C_B(11) Indoor error 53 Indoor Error High
28/06/26   16:35 06_6P-C (055) 06P-C_B(11) Indoor error 53 Indoor Error High
28/06/26   16:35 07_6P-C (056) 06P-C_B(11) Indoor error 53 Indoor Error High
28/06/26   16:35 08_6P-C (057) 06P-C_B(11) Indoor error 53 Indoor Error High
28/06/26   14:20 6P-D-MAIN 06P-D_1 Outdoor error 77 Outdoor Error High
28/06/26   13:55 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
28/06/26   08:35 ESCRIT├ôRIO 1_16P-D (0FE) 16P-D_F(15) Units disconnected Units disconnected High
28/06/26   07:55 NOBREAK_4P-C (035) 04P-C_7 Indoor error 10 Indoor unit BLDC fan motor communications error. Indoor Error High
28/06/26   07:15 01_7P-B (060) 07P-B_2 Indoor error 53 Indoor Error High
28/06/26   07:15 03_7P-B (062) 07P-B_2 Indoor error 53 Indoor Error High
28/06/26   07:15 04_7P-B (063) 07P-B_2 Indoor error 53 Indoor Error High
28/06/26   07:15 06_7P-B (065) 07P-B_2 Indoor error 53 Indoor Error High
28/06/26   07:15 08_7P-B (067) 07P-B_2 Indoor error 53 Indoor Error High
28/06/26   07:15 L6.06A.0165_7P-D (06A) 07P-D_3 Indoor error 53 Indoor Error High
28/06/26   07:15 L6.06B.0165_7P-D (06B) 07P-D_3 Indoor error 53 Indoor Error High
28/06/26   07:15 L6.06C.0165_7P-D (06C) 07P-D_3 Indoor error 53 Indoor Error High
28/06/26   07:15 L6.06E.0165_7P-D (06E) 07P-D_3 Indoor error 53 Indoor Error High
28/06/26   07:15 L6.06F.0165_7P-D (06F) 07P-D_3 Indoor error 53 Indoor Error High
28/06/26   07:15 02_7P-B (061) 07P-B_2 Indoor error 53 Indoor Error High
28/06/26   07:15 05_7P-B (064) 07P-B_2 Indoor error 53 Indoor Error High
28/06/26   07:15 07_7P-B (066) 07P-B_2 Indoor error 53 Indoor Error High
28/06/26   07:15 L6.068.01650_7P-D (068) 07P-D_3 Indoor error 53 Indoor Error High
28/06/26   07:15 L6.069.0165_7P-D (069) 07P-D_3 Indoor error 53 Indoor Error High
28/06/26   07:15 L6.06D.0165_7P-D (06D) 07P-D_3 Indoor error 53 Indoor Error High
28/06/26   07:13 ODU L6.300.0D80 07P-D_3 Outdoor error 53 Outdoor Error High
28/06/26   07:13 ODU L6.200.0D80 07P-B_2 Outdoor error 53 Outdoor Error High
28/06/26   06:55 01_10P-D (000) 10P-D_F(15) Indoor error 53 Indoor Error High
28/06/26   06:55 L4.001.0D80_1P-B (001) 01P-B_0 Indoor error 53 Indoor Error High
28/06/26   06:55 02_10P-D (098) 10P-D_F(15) Indoor error 53 Indoor Error High
28/06/26   06:55 03_10P-D (099) 10P-D_F(15) Indoor error 53 Indoor Error High
28/06/26   06:55 04_10P-D (09A) 10P-D_F(15) Indoor error 53 Indoor Error High
28/06/26   06:55 05_10P-D (09B) 10P-D_F(15) Indoor error 53 Indoor Error High
28/06/26   06:55 06_10P-D (09C) 10P-D_F(15) Indoor error 53 Indoor Error High
28/06/26   06:55 07_10P-D (09D) 10P-D_F(15) Indoor error 53 Indoor Error High
28/06/26   06:55 08_10P-D (09E) 10P-D_F(15) Indoor error 53 Indoor Error High
28/06/26   06:55 09_10P-D (09F) 10P-D_F(15) Indoor error 53 Indoor Error High
28/06/26   06:55 01_10P-B (0A0) 10P-B_E(14) Indoor error 53 Indoor Error High
28/06/26   06:55 02_10P-B (0A1) 10P-B_E(14) Indoor error 53 Indoor Error High
28/06/26   06:55 03_10P-B (0A2) 10P-B_E(14) Indoor error 53 Indoor Error High
28/06/26   06:55 04_10P-B (0A3) 10P-B_E(14) Indoor error 53 Indoor Error High
28/06/26   06:55 05_10P-B (0A4) 10P-B_E(14) Indoor error 53 Indoor Error High
28/06/26   06:55 06_10P-B (0A5) 10P-B_E(14) Indoor error 53 Indoor Error High
28/06/26   06:55 07_10P-B (0A6) 10P-B_E(14) Indoor error 53 Indoor Error High
28/06/26   06:55 08_10P-B (0A7) 10P-B_E(14) Indoor error 53 Indoor Error High
28/06/26   06:54 ODU L4.F00.0D80 10P-D_F(15) Outdoor error 53 Outdoor Error High
28/06/26   06:54 ODU L4.E00.0D80 10P-B_E(14) Outdoor error 53 Outdoor Error High
28/06/26   06:50 L4.019.1235_CPD_16P-C (019) 16P-C_4_F Indoor error 151 Indoor Error High
28/06/26   06:50 DIRETORIA_16P-C (0F0) 16P-C_4_F Indoor error 151 Indoor Error High
28/06/26   06:50 ESCRIT├ôRIO 4_16P-C (0F1) 16P-C_4_F Indoor error 151 Indoor Error High
28/06/26   06:50 ESCRIT├ôRIO 2_16P-C (0F2) 16P-C_4_F Indoor error 151 Indoor Error High
28/06/26   06:50 ESCRIT├ôRIO 1_16P-C (0F3) 16P-C_4_F Indoor error 151 Indoor Error High
28/06/26   06:50 ESCRIT├ôRIO 3_16P-C (0F4) 16P-C_4_F Indoor error 151 Indoor Error High
28/06/26   06:50 DEP├ôSITO_16P-C (0F5) 16P-C_4_F Indoor error 151 Indoor Error High
28/06/26   06:50 ESCRIT├ôRIO 5_16P-C (0F6) 16P-C_4_F Indoor error 151 Indoor Error High
28/06/26   06:50 ESCRIT├ôRIO 6_16P-C (0F7) 16P-C_4_F Indoor error 151 Indoor Error High
28/06/26   06:49 15-P-C_MAIN 15-P-C_D(13) Outdoor error 45 Outdoor Error High
28/06/26   06:49 14P-A_MAIN 14P-A_A(10) Outdoor error 53 Outdoor Error High
28/06/26   06:49 ODU L6.B00.0D80 14P-D_B(11) VAGO Outdoor error 53 Outdoor Error High
28/06/26   06:49 ODU L6.A00.0D80 14P-B_A(10) VAGO Outdoor error 53 Outdoor Error High
28/06/26   06:49 6P-D-MAIN 06P-D_1 Outdoor error 53 Outdoor Error High
28/06/26   06:49 ODU L4.200.0D80 02P-B_2 Outdoor error 53 Outdoor Error High
28/06/26   06:49 ODU L6.B00.1235 06P-C_B(11) Outdoor error 53 Outdoor Error High
28/06/26   06:49 ODU L4.F00.1235 16P-C_4_F Outdoor error 151 Outdoor Error High
28/06/26   06:49 ODU L6.900.1235 05P-C_9 Outdoor error 53 Outdoor Error High
28/06/26   06:49 02P-A_MAIN 02P-A_2 Outdoor error 53 Outdoor Error High
28/06/26   06:48 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
28/06/26   06:48 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
28/06/26   06:48 01P-B_MAIN 01P-B_0 Outdoor error 53 Outdoor Error High
28/06/26   06:48 ODU L4.700.0D80 03P-B_7 Outdoor error 53 Outdoor Error High
28/06/26   06:48 ODU L4.600.0D80 03P-D_6 Outdoor error 53 Outdoor Error High
28/06/26   06:48 ODU L4.300.0D80 02P-D_3 Outdoor error 53 Outdoor Error High
28/06/26   06:48 10P-C_MAIN 10P-C_4_3 Outdoor error 53 Outdoor Error High
28/06/26   06:48 10P-A_MAIN 10P-A_4_2 Outdoor error 53 Outdoor Error High
28/06/26   06:45 L6.0E4_15P-C (0E4) 15-P-C_D(13) Indoor error 45 Indoor Error High
28/06/26   06:45 L6.0E5_15P-C (0E5) 15-P-C_D(13) Indoor error 45 Indoor Error High
28/06/26   06:45 L6.0E6_15P-C (0E6) 15-P-C_D(13) Indoor error 45 Indoor Error High
28/06/26   06:45 L6.0E7_15P-C (0E7) 15-P-C_D(13) Indoor error 45 Indoor Error High
28/06/26   06:45 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
28/06/26   06:45 ESCRIT├ôRIO 1_1P-D (00A) 01P-D_1 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
28/06/26   06:45 ESCRIT├ôRIO 3_1P-D (00C) 01P-D_1 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
28/06/26   06:45 SALA SOM_3P-B (025) 03P-B_7 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
27/06/26   19:58 multiple multiple Units disconnected Units disconnected High
27/06/26   19:58 multiple multiple Units disconnected Units disconnected High
27/06/26   19:58 multiple multiple Units disconnected Units disconnected High
27/06/26   19:58 multiple multiple Units disconnected Units disconnected High
27/06/26   19:57 multiple 15-P-C_D(13) Units disconnected Units disconnected High
27/06/26   19:57 multiple multiple Units disconnected Units disconnected High
27/06/26   19:16 ODU L4.B00.0D80 08P-D_B(11) Outdoor error 24 Outdoor Error High
27/06/26   19:15 ENEL 5_5P-C (040) 05P-C_9 Indoor error 53 Indoor Error High
27/06/26   19:15 ENEL 7_5P-C (041) 05P-C_9 Indoor error 53 Indoor Error High
27/06/26   19:15 ENEL 4_5P-C (042) 05P-C_9 Indoor error 53 Indoor Error High
27/06/26   19:15 ENEL 6_5P-C (043) 05P-C_9 Indoor error 53 Indoor Error High
27/06/26   19:15 ENEL 3_5P-C (044) 05P-C_9 Indoor error 53 Indoor Error High
27/06/26   19:15 WC MASC_5P-C (045) 05P-C_9 Indoor error 53 Indoor Error High
27/06/26   19:15 ENEL 1_5P-C (046) 05P-C_9 Indoor error 53 Indoor Error High
27/06/26   19:15 ENEL 2_5P-C (047) 05P-C_9 Indoor error 53 Indoor Error High
27/06/26   19:15 REFEIT├ôRIO_5P-A (048) 05P-A_8 Indoor error 53 Indoor Error High
27/06/26   19:15 CLARO GED 2_5P-A (049) 05P-A_8 Indoor error 53 Indoor Error High
27/06/26   19:15 CLARO GED 3_5P-A (04A) 05P-A_8 Indoor error 53 Indoor Error High
27/06/26   19:15 CLARO GED 1_5P-A (04B) 05P-A_8 Indoor error 53 Indoor Error High
27/06/26   19:15 CREA 2_5P-A (04C) 05P-A_8 Indoor error 53 Indoor Error High
27/06/26   19:15 WC FEMININO_5P-A (04D) 05P-A_8 Indoor error 53 Indoor Error High
27/06/26   19:15 QUALIDADE_5P-A (04E) 05P-A_8 Indoor error 53 Indoor Error High
27/06/26   19:15 CREA 1_5P-A (04F) 05P-A_8 Indoor error 53 Indoor Error High
27/06/26   19:12 ODU L6.800.1235 05P-A_8 Outdoor error 53 Outdoor Error High
27/06/26   19:11 ODU L4.900.0D80 05P-D_9 Outdoor error 53 Outdoor Error High
27/06/26   19:11 ODU L4.800.0D80 05P-B_8 Outdoor error 53 Outdoor Error High
27/06/26   19:10 DIRETORIA_5P-B (015) 05P-B_8 Indoor error 53 Indoor Error High
27/06/26   19:10 REUNI├âO_5P-D (016) 05P-D_9 Indoor error 53 Indoor Error High
27/06/26   19:10 PRESID├èNCIA_5P-B (040) 05P-B_8 Indoor error 53 Indoor Error High
27/06/26   19:10 COMERCIAL_5P-B (041) 05P-B_8 Indoor error 53 Indoor Error High
27/06/26   19:10 STAFF 2_5P-B (042) 05P-B_8 Indoor error 53 Indoor Error High
27/06/26   19:10 RECEP├ç├âO_5P-B (043) 05P-B_8 Indoor error 53 Indoor Error High
27/06/26   19:10 STAFF 1_5P-B (044) 05P-B_8 Indoor error 53 Indoor Error High
27/06/26   19:10 NOBREAK_5P-B (045) 05P-B_8 Indoor error 53 Indoor Error High
27/06/26   19:10 STAFF 4_5P-B (046) 05P-B_8 Indoor error 53 Indoor Error High
27/06/26   19:10 STAFF 3_5P-B (047) 05P-B_8 Indoor error 53 Indoor Error High
27/06/26   19:10 REUNI├âO DIRETORIA_5P-D (048) 05P-D_9 Indoor error 53 Indoor Error High
27/06/26   19:10 CLARO 1_5P-D (049) 05P-D_9 Indoor error 53 Indoor Error High
27/06/26   19:10 CLARO 2_5P-D (04A) 05P-D_9 Indoor error 53 Indoor Error High
27/06/26   19:10 CLARO 3_5P-D (04B) 05P-D_9 Indoor error 53 Indoor Error High
27/06/26   19:10 CLARO 4_5P-D (04C) 05P-D_9 Indoor error 53 Indoor Error High
27/06/26   19:10 CLARO IDF_5P-D (04D) 05P-D_9 Indoor error 53 Indoor Error High
27/06/26   19:10 CLARO 6_5P-D (04E) 05P-D_9 Indoor error 53 Indoor Error High
27/06/26   19:10 CLARO 5_5P-D (04F) 05P-D_9 Indoor error 53 Indoor Error High
27/06/26   19:05 L6.0E5_15P-C (0E5) 15-P-C_D(13) Indoor error 45 Indoor Error High
27/06/26   19:05 L6.0E6_15P-C (0E6) 15-P-C_D(13) Indoor error 45 Indoor Error High
27/06/26   19:05 L6.0E7_15P-C (0E7) 15-P-C_D(13) Indoor error 45 Indoor Error High
27/06/26   19:04 multiple multiple Units disconnected Units disconnected High
27/06/26   19:03 ODU L6.B00.1235 06P-C_B(11) Outdoor error 53 Outdoor Error High
27/06/26   19:01 multiple multiple Units disconnected Units disconnected High
27/06/26   19:01 multiple 15-P-C_D(13) Units disconnected Units disconnected High
27/06/26   19:01 multiple multiple Units disconnected Units disconnected High
27/06/26   18:30 08_7P-B (067) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:30 L6.06A.0165_7P-D (06A) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:30 L6.06B.0165_7P-D (06B) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:30 07_7P-B (066) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:30 L6.068.01650_7P-D (068) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:30 L6.069.0165_7P-D (069) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:25 01_7P-B (060) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:25 04_7P-B (063) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:25 06_7P-B (065) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:25 L6.06E.0165_7P-D (06E) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:25 05_7P-B (064) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:25 L6.06D.0165_7P-D (06D) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:22 ODU L6.200.0D80 07P-B_2 Outdoor error 53 Outdoor Error High
27/06/26   18:21 ODU L6.300.0D80 07P-D_3 Outdoor error 53 Outdoor Error High
27/06/26   18:05 01_7P-B (060) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:05 03_7P-B (062) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:05 04_7P-B (063) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:05 06_7P-B (065) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:05 08_7P-B (067) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:05 L6.06A.0165_7P-D (06A) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:05 L6.06B.0165_7P-D (06B) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:05 L6.06C.0165_7P-D (06C) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:05 L6.06E.0165_7P-D (06E) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:05 L6.06F.0165_7P-D (06F) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:05 02_7P-B (061) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:05 05_7P-B (064) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:05 07_7P-B (066) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   18:05 L6.068.01650_7P-D (068) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:05 L6.069.0165_7P-D (069) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:05 L6.06D.0165_7P-D (06D) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   18:04 ODU L6.300.0D80 07P-D_3 Outdoor error 53 Outdoor Error High
27/06/26   18:04 ODU L6.200.0D80 07P-B_2 Outdoor error 53 Outdoor Error High
27/06/26   16:45 01_7P-B (060) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   16:45 03_7P-B (062) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   16:45 04_7P-B (063) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   16:45 06_7P-B (065) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   16:45 08_7P-B (067) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   16:45 L6.06A.0165_7P-D (06A) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   16:45 L6.06B.0165_7P-D (06B) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   16:45 L6.06C.0165_7P-D (06C) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   16:45 L6.06E.0165_7P-D (06E) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   16:45 L6.06F.0165_7P-D (06F) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   16:45 05_7P-B (064) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   16:45 07_7P-B (066) 07P-B_2 Indoor error 53 Indoor Error High
27/06/26   16:45 L6.068.01650_7P-D (068) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   16:45 L6.069.0165_7P-D (069) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   16:45 L6.06D.0165_7P-D (06D) 07P-D_3 Indoor error 53 Indoor Error High
27/06/26   16:44 ODU L6.300.0D80 07P-D_3 Outdoor error 53 Outdoor Error High
27/06/26   16:44 ODU L6.200.0D80 07P-B_2 Outdoor error 53 Outdoor Error High
27/06/26   12:10 ODU L4.F00.0D80 10P-D_F(15) Outdoor error 53 Outdoor Error High
27/06/26   11:55 L4.002.1235_10P-A (002) 10P-A_4_2 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.090.0166_10P-C (090) 10P-C_4_3 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.091.0166_10P-C (091) 10P-C_4_3 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.092.0166_10P-C (092) 10P-C_4_3 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.093.1235_10P-C (093) 10P-C_4_3 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.094.1235_10P-C (094) 10P-C_4_3 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.095.1235_10P-C (095) 10P-C_4_3 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.096.1235_10P-C (096) 10P-C_4_3 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.0A8.0166_10P-A (0A8) 10P-A_4_2 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.0A9.0166_10P-A (0A9) 10P-A_4_2 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.0AA.0166_10P-A (0AA) 10P-A_4_2 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.0AB.0166_10P-A (0AB) 10P-A_4_2 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.0AC.0166_10P-A (0AC) 10P-A_4_2 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.0AD.0166_10P-A (0AD) 10P-A_4_2 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.0AE.0166_10P-A (0AE) 10P-A_4_2 Indoor error 53 Indoor Error High
27/06/26   11:55 L4.0AF.0166_10P-A (0AF) 10P-A_4_2 Indoor error 53 Indoor Error High
27/06/26   11:54 10P-C_MAIN 10P-C_4_3 Outdoor error 53 Outdoor Error High
27/06/26   11:54 10P-A_MAIN 10P-A_4_2 Outdoor error 53 Outdoor Error High
27/06/26   11:45 01_10P-D (000) 10P-D_F(15) Indoor error 53 Indoor Error High
27/06/26   11:45 L4.001.0D80_1P-B (001) 01P-B_0 Indoor error 53 Indoor Error High
27/06/26   11:45 02_10P-D (098) 10P-D_F(15) Indoor error 53 Indoor Error High
27/06/26   11:45 03_10P-D (099) 10P-D_F(15) Indoor error 53 Indoor Error High
27/06/26   11:45 04_10P-D (09A) 10P-D_F(15) Indoor error 53 Indoor Error High
27/06/26   11:45 05_10P-D (09B) 10P-D_F(15) Indoor error 53 Indoor Error High
27/06/26   11:45 06_10P-D (09C) 10P-D_F(15) Indoor error 53 Indoor Error High
27/06/26   11:45 07_10P-D (09D) 10P-D_F(15) Indoor error 53 Indoor Error High
27/06/26   11:45 08_10P-D (09E) 10P-D_F(15) Indoor error 53 Indoor Error High
27/06/26   11:45 09_10P-D (09F) 10P-D_F(15) Indoor error 53 Indoor Error High
27/06/26   11:45 01_10P-B (0A0) 10P-B_E(14) Indoor error 53 Indoor Error High
27/06/26   11:45 02_10P-B (0A1) 10P-B_E(14) Indoor error 53 Indoor Error High
27/06/26   11:45 03_10P-B (0A2) 10P-B_E(14) Indoor error 53 Indoor Error High
27/06/26   11:45 04_10P-B (0A3) 10P-B_E(14) Indoor error 53 Indoor Error High
27/06/26   11:45 05_10P-B (0A4) 10P-B_E(14) Indoor error 53 Indoor Error High
27/06/26   11:45 06_10P-B (0A5) 10P-B_E(14) Indoor error 53 Indoor Error High
27/06/26   11:45 07_10P-B (0A6) 10P-B_E(14) Indoor error 53 Indoor Error High
27/06/26   11:45 08_10P-B (0A7) 10P-B_E(14) Indoor error 53 Indoor Error High
27/06/26   11:45 ODU L4.F00.0D80 10P-D_F(15) Outdoor error 53 Outdoor Error High
27/06/26   11:45 ODU L4.E00.0D80 10P-B_E(14) Outdoor error 53 Outdoor Error High
27/06/26   08:30 ├üREA ROTATIVA_17_2P-B (017) 02P-B_2 Indoor error 53 Indoor Error High
27/06/26   08:30 ├üREA ROTATIVA_18_2P-B (018) 02P-B_2 Indoor error 53 Indoor Error High
27/06/26   08:30 INOVA├ç├âO_19_2P-B (019) 02P-B_2 Indoor error 53 Indoor Error High
27/06/26   08:30 SL DE REUNI├âO_1A_2P-B (01A) 02P-B_2 Indoor error 53 Indoor Error High
27/06/26   08:30 RECEP├ç├âO_1B_2P-B (01B) 02P-B_2 Indoor error 53 Indoor Error High
27/06/26   08:30 ├üREA ROTATIVA_1C_2P-B (01C) 02P-B_2 Indoor error 53 Indoor Error High
27/06/26   08:30 GSC_1D_2P-B (01D) 02P-B_2 Indoor error 53 Indoor Error High
27/06/26   08:30 GSC_1E_2P-B (01E) 02P-B_2 Indoor error 53 Indoor Error High
27/06/26   08:30 CPD_1F_2P-B (01F) 02P-B_2 Indoor error 53 Indoor Error High
27/06/26   08:27 ODU L4.200.0D80 02P-B_2 Outdoor error 53 Outdoor Error High
27/06/26   08:26 ODU L4.300.0D80 02P-D_3 Outdoor error 53 Outdoor Error High
27/06/26   08:26 02P-A_MAIN 02P-A_2 Outdoor error 53 Outdoor Error High
27/06/26   08:25 GSC_18_2P-A (018) 01P-A_0 Indoor error 53 Indoor Error High
27/06/26   08:25 ENGENHARIA_19_2P-A (019) 02P-A_2 Indoor error 53 Indoor Error High
27/06/26   08:25 ENGENHARIA_1A_2P-A (01A) 02P-A_2 Indoor error 53 Indoor Error High
27/06/26   08:25 ENGENHARIA_1B _2P-A (01B) 02P-A_2 Indoor error 53 Indoor Error High
27/06/26   08:25 ENGENHARIA_1C_2P-A (01C) 02P-A_2 Indoor error 53 Indoor Error High
27/06/26   08:25 ENGENHARIA_1D__2P-A (01D) 02P-A_2 Indoor error 53 Indoor Error High
27/06/26   08:25 ENGENHARIA_1E_2P-A (01E) 02P-A_2 Indoor error 53 Indoor Error High
27/06/26   08:25 ENGENHARIA_1F_2P-A (01F) 02P-A_2 Indoor error 53 Indoor Error High
27/06/26   08:25 SL DE TREINAMENTO_50_2P-D (050) 02P-D_3 Indoor error 53 Indoor Error High
27/06/26   08:25 LAB_51_2P-D (051) 02P-D_3 Indoor error 53 Indoor Error High
27/06/26   08:25 DESCOMPRESS├âO_52_2P-D (052) 02P-D_3 Indoor error 53 Indoor Error High
27/06/26   08:25 DESCOMPRESS├âO_53_2P-D (053) 02P-D_3 Indoor error 53 Indoor Error High
27/06/26   08:25 DESCOMPRESS├âO_54_2P-D (054) 02P-D_3 Indoor error 53 Indoor Error High
27/06/26   08:25 SL DE REUNI├âO_55_2P-D (055) 02P-D_3 Indoor error 53 Indoor Error High
27/06/26   08:25 RECEP├ç├âO_56_2P-D (056) 02P-D_3 Indoor error 53 Indoor Error High
27/06/26   08:25 SL DE REUNI├âO_57_2P-D (057) 02P-D_3 Indoor error 53 Indoor Error High
27/06/26   08:25 RECEP├ç├âO_58_2P-D (058) 02P-D_3 Indoor error 53 Indoor Error High
26/06/26   22:05 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
26/06/26   21:36 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
26/06/26   21:16 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
26/06/26   21:00 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
26/06/26   20:40 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
26/06/26   17:00 03_6P-D (05A) 06P-D_1 Indoor error 4 Indoor unit drain overflow error. Indoor Error High
26/06/26   16:05 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
26/06/26   16:04 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
26/06/26   12:04 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
26/06/26   12:04 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
26/06/26   07:34 multiple multiple Units disconnected Units disconnected High
26/06/26   07:32 multiple multiple Units disconnected Units disconnected High
26/06/26   07:32 UE-07_3P-C (026) 03P-C_5 Units disconnected Units disconnected High
25/06/26   23:27 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
25/06/26   23:27 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
25/06/26   16:55 14P-A_MAIN 14P-A_A(10) Outdoor error 53 Outdoor Error High
25/06/26   14:42 14P-A_MAIN 14P-A_A(10) Outdoor error 53 Outdoor Error High
25/06/26   09:56 14P-A_MAIN 14P-A_A(10) Outdoor error 53 Outdoor Error High
25/06/26   08:55 PORTO PREMIO 2_4P-A (03B) 04P-A_6 Indoor error 10 Indoor unit BLDC fan motor communications error. Indoor Error High
24/06/26   21:34 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
24/06/26   21:34 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
24/06/26   21:11 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
24/06/26   17:15 11P-C_MAIN 11P-C_4_5 Outdoor error 116 Outdoor Error High
23/06/26   19:09 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
23/06/26   19:09 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
23/06/26   06:45 01_13P-B (0C0) 13P-B_8 Indoor error 53 Indoor Error High
23/06/26   06:45 02_VICE PRESID├èNCIA (0C1) 13P-B_8 Indoor error 53 Indoor Error High
23/06/26   06:45 03_TELEVENDAS 5 (0C2) 13P-B_8 Indoor error 53 Indoor Error High
23/06/26   06:45 04_TELEVENDAS 4 (0C3) 13P-B_8 Indoor error 53 Indoor Error High
23/06/26   06:45 08_CPD (0C7) 13P-B_8 Indoor error 53 Indoor Error High
23/06/26   06:45 06_SL DANIEL (0C5) 13P-B_8 Indoor error 53 Indoor Error High
23/06/26   06:45 07_TELEVENDAS 2 (0C6) 13P-B_8 Indoor error 53 Indoor Error High
23/06/26   06:45 05_ TELEVENDAS 3 (0C4) 13P-B_8 Indoor error 53 Indoor Error High
23/06/26   06:42 ODU L6.800.0D80 13P-B_8 Outdoor error 53 Outdoor Error High
22/06/26   22:15 6P-D-MAIN 06P-D_1 Outdoor error 21 Outdoor Error High
22/06/26   21:59 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
22/06/26   21:59 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
22/06/26   21:35 ODU L6.700.1235 04P-C_7 Outdoor error 26 Outdoor Error High
22/06/26   13:27 ODU L4.900.1235 13P-C_4_9 Outdoor error 150 Outdoor Error High
22/06/26   08:55 L4.0B8.1235_12P-A (0B8) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   08:55 L4.0B9.1235_12P-A (0B9) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   08:55 L4.0BA.1235_12P-A (0BA) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   08:55 L4.0BB.1235_12P-A (0BB) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   08:40 L4.0BC.1235_12P-A (0BC) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   08:40 L4.0BD.1235_12P-A (0BD) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   08:40 L4.0BE.1235_12P-A (0BE) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   08:40 L4.0BF.1235_12P-A (0BF) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   08:39 ODU L4.600.1235 12P-A_4_6 Outdoor error 53 Outdoor Error High
22/06/26   07:50 L4.0BC.1235_12P-A (0BC) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   07:50 L4.0BD.1235_12P-A (0BD) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   07:50 L4.0BE.1235_12P-A (0BE) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   07:50 L4.0BF.1235_12P-A (0BF) 12P-A_4_6 Indoor error 53 Indoor Error High
22/06/26   07:46 ODU L4.600.1235 12P-A_4_6 Outdoor error 53 Outdoor Error High
22/06/26   07:40 L4.0BD.1235_12P-A (0BD) 12P-A_4_6 Indoor error 4 Indoor unit drain overflow error. Indoor Error High
21/06/26   13:55 L6.010_2P-C (010) 02P-C_3 Indoor error 53 Indoor Error High
21/06/26   13:55 L6.011_2P-C (011) 02P-C_3 Indoor error 53 Indoor Error High
21/06/26   13:55 L6.012_2P-C (012) 02P-C_3 Indoor error 53 Indoor Error High
21/06/26   13:55 L6.013_2P-C (013) 02P-C_3 Indoor error 53 Indoor Error High
21/06/26   13:55 L6.014_2P-C (014) 02P-C_3 Indoor error 53 Indoor Error High
21/06/26   13:55 L6.015_2P-C (015) 02P-C_3 Indoor error 53 Indoor Error High
21/06/26   13:55 L6.016_2P-C (016) 02P-C_3 Indoor error 53 Indoor Error High
21/06/26   13:55 L6.017_2P-C (017) 02P-C_3 Indoor error 53 Indoor Error High
21/06/26   13:54 02P-C_MAIN 02P-C_3 Outdoor error 53 Outdoor Error High
21/06/26   02:25 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
21/06/26   01:20 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
21/06/26   01:00 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
21/06/26   00:45 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
20/06/26   05:45 NOBREAK_4P-C (035) 04P-C_7 Indoor error 10 Indoor unit BLDC fan motor communications error. Indoor Error High
20/06/26   00:00 L4.09E.0166_11P-A (09E) 11P-A_4_4 Indoor error 2 Indoor unit inlet pipe temperature sensor communication error. Indoor Error High
19/06/26   11:37 multiple 09P-C_4_1 Units disconnected Units disconnected High
19/06/26   11:37 CPD_9P-C (0D8) 09P-C_4_1 Units disconnected Units disconnected High
19/06/26   11:36 multiple 09P-C_4_1 Units disconnected Units disconnected High
19/06/26   11:00 CALL CENTER 1_9P-C (080) 09P-C_4_1 Indoor error 53 Indoor Error High
19/06/26   11:00 CALL CENTER 2_9P-C (081) 09P-C_4_1 Indoor error 53 Indoor Error High
19/06/26   11:00 CALL CENTER 3_9P-C (082) 09P-C_4_1 Indoor error 53 Indoor Error High
19/06/26   11:00 CALL CENTER 4_9P-C (083) 09P-C_4_1 Indoor error 53 Indoor Error High
19/06/26   11:00 CALL CENTER 5_9P-C (084) 09P-C_4_1 Indoor error 53 Indoor Error High
19/06/26   11:00 VENDAS 3_9P-C (085) 09P-C_4_1 Indoor error 53 Indoor Error High
19/06/26   11:00 VENDAS 1_9P-C (086) 09P-C_4_1 Indoor error 53 Indoor Error High
19/06/26   11:00 VENDAS 2_9P-C (087) 09P-C_4_1 Indoor error 53 Indoor Error High
19/06/26   10:56 09P-C_MAIN 09P-C_4_1 Outdoor error 53 Outdoor Error High
19/06/26   07:20 L4.0BD.1235_12P-A (0BD) 12P-A_4_6 Indoor error 4 Indoor unit drain overflow error. Indoor Error High
19/06/26   06:45 ODU L6.B00.0D80 14P-D_B(11) VAGO Outdoor error 53 Outdoor Error High
19/06/26   06:45 ODU L6.900.0D80 13P-D_9 Outdoor error 53 Outdoor Error High
19/06/26   06:44 14P-A_MAIN 14P-A_A(10) Outdoor error 53 Outdoor Error High
19/06/26   06:44 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
19/06/26   06:44 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
19/06/26   06:44 01P-B_MAIN 01P-B_0 Outdoor error 53 Outdoor Error High
19/06/26   06:44 ODU L6.A00.0D80 14P-B_A(10) VAGO Outdoor error 53 Outdoor Error High
19/06/26   06:44 ODU L6.800.0D80 13P-B_8 Outdoor error 53 Outdoor Error High
19/06/26   06:44 ODU L6.900.1235 05P-C_9 Outdoor error 53 Outdoor Error High
19/06/26   06:44 02P-C_MAIN 02P-C_3 Outdoor error 53 Outdoor Error High
19/06/26   06:44 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
19/06/26   06:44 multiple 06P-D_1 Units disconnected Units disconnected High
19/06/26   06:41 multiple multiple Units disconnected Units disconnected High
19/06/26   06:41 multiple multiple Units disconnected Units disconnected High
19/06/26   06:40 UE-07_1P-C (006) 01P-C_1 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 UE-02_1P-A (009) 01P-A_0 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 UE-07_1P-A (00E) 01P-A_0 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 UE-08_1P-A (00F) 01P-A_0 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 GSC_18_2P-A (018) 01P-A_0 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 ENGENHARIA_1A_2P-A (01A) 02P-A_2 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 UE-04_3P-C (023) 03P-C_5 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 UE-07_3P-C (026) 03P-C_5 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 SKY 4_4P-C (031) 04P-C_7 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 SKY 2_4P-C (033) 04P-C_7 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 TREINAMENTO 4_4P-A (038) 04P-A_6 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 PORTO PREMIO 3_4P-A (03D) 04P-A_6 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 ENEL 1_5P-C (046) 05P-C_9 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 ENEL 2_5P-C (047) 05P-C_9 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 CREA 2_5P-A (04C) 05P-A_8 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 QUALIDADE_5P-A (04E) 05P-A_8 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 CREA 1_5P-A (04F) 05P-A_8 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 SL DE REUNI├âO_57_2P-D (057) 02P-D_3 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 06_8P-B_75 (075) 08P-B_A(10) Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 07_8P-B_76 (076) 08P-B_A(10) Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 03_8P-D_7A (07A) 08P-D_B(11) Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 03_10P-D (099) 10P-D_F(15) Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:40 L4.004.1235_11P-C (004) 11P-C_4_5 Indoor error 5 Communication error between outdoor unit PCB and indoor unit PCB. Indoor Error High
19/06/26   06:07 14P-A_MAIN 14P-A_A(10) Outdoor error 53 Outdoor Error High
19/06/26   06:07 ODU L4.D00.0D80 09P-D_D(13) Outdoor error 53 Outdoor Error High
19/06/26   06:07 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
19/06/26   06:07 01P-B_MAIN 01P-B_0 Outdoor error 53 Outdoor Error High
19/06/26   06:07 ODU L6.B00.0D80 14P-D_B(11) VAGO Outdoor error 53 Outdoor Error High
19/06/26   06:07 ODU L6.A00.0D80 14P-B_A(10) VAGO Outdoor error 53 Outdoor Error High
19/06/26   06:06 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
19/06/26   06:06 multiple multiple Units disconnected Units disconnected High
19/06/26   06:05 multiple multiple Units disconnected Units disconnected High
19/06/26   06:05 multiple 15-P-C_D(13) Units disconnected Units disconnected High
19/06/26   06:04 multiple multiple Units disconnected Units disconnected High
19/06/26   02:30 L4.0BD.1235_12P-A (0BD) 12P-A_4_6 Indoor error 4 Indoor unit drain overflow error. Indoor Error High
18/06/26   23:00 02P-C_MAIN 02P-C_3 Outdoor error 32 Outdoor Error High
18/06/26   20:40 02P-C_MAIN 02P-C_3 Outdoor error 21 Outdoor Error High
18/06/26   17:44 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
18/06/26   17:20 L4.0C0.0166_13P-C (0C0) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0C1.0166_13P-C (0C1) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0C2.0166_13P-C (0C2) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0C3.0166_13P-C (0C3) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0C4.0166_13P-C (0C4) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0C5.0166_13P-C (0C5) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0C6.0166_13P-C (0C6) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0C7.0166_13P-C (0C7) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0E0.1235_13P-C (0E0) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0E1.1235_13P-C (0E1) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0E2.1235_13P-C (0E2) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0E3.1235_13P-C (0E3) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:20 L4.0E4.1235_13P-C (0E4) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   17:19 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
18/06/26   11:41 02P-C_MAIN 02P-C_3 Outdoor error 77 Outdoor Error High
18/06/26   10:48 09P-C_MAIN 09P-C_4_1 Outdoor error 53 Outdoor Error High
18/06/26   10:39 09P-C_MAIN 09P-C_4_1 Outdoor error 53 Outdoor Error High
18/06/26   10:30 09P-C_MAIN 09P-C_4_1 Outdoor error 53 Outdoor Error High
18/06/26   10:16 09P-C_MAIN 09P-C_4_1 Outdoor error 53 Outdoor Error High
18/06/26   10:06 09P-C_MAIN 09P-C_4_1 Outdoor error 53 Outdoor Error High
18/06/26   09:45 09P-C_MAIN 09P-C_4_1 Outdoor error 53 Outdoor Error High
18/06/26   09:05 09P-C_MAIN 09P-C_4_1 Outdoor error 53 Outdoor Error High
18/06/26   07:15 L4.0C0.0166_13P-C (0C0) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   07:15 L4.0C1.0166_13P-C (0C1) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   07:15 L4.0C6.0166_13P-C (0C6) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   07:15 L4.0C7.0166_13P-C (0C7) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   07:15 L4.0E0.1235_13P-C (0E0) 13P-C_4_9 Indoor error 53 Indoor Error High
18/06/26   07:12 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
17/06/26   22:58 ODU L6.900.1235 05P-C_9 Outdoor error 53 Outdoor Error High
17/06/26   22:57 ODU L6.900.1235 05P-C_9 Outdoor error 35 Outdoor Error High
17/06/26   17:45 L4.0C0.0166_13P-C (0C0) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0C1.0166_13P-C (0C1) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0C2.0166_13P-C (0C2) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0C3.0166_13P-C (0C3) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0C4.0166_13P-C (0C4) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0C5.0166_13P-C (0C5) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0C6.0166_13P-C (0C6) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0C7.0166_13P-C (0C7) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0E0.1235_13P-C (0E0) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0E1.1235_13P-C (0E1) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0E2.1235_13P-C (0E2) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0E3.1235_13P-C (0E3) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:45 L4.0E4.1235_13P-C (0E4) 13P-C_4_9 Indoor error 53 Indoor Error High
17/06/26   17:43 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
17/06/26   15:33 ODU L6.700.1235 04P-C_7 Outdoor error 21 Outdoor Error High
17/06/26   12:32 09P-C_MAIN 09P-C_4_1 Outdoor error 42 Outdoor Error High
17/06/26   11:10 CALL CENTER 1_9P-C (080) 09P-C_4_1 Indoor error 42 Indoor Error High
17/06/26   11:10 CALL CENTER 2_9P-C (081) 09P-C_4_1 Indoor error 42 Indoor Error High
17/06/26   11:10 CALL CENTER 3_9P-C (082) 09P-C_4_1 Indoor error 42 Indoor Error High
17/06/26   11:10 CALL CENTER 4_9P-C (083) 09P-C_4_1 Indoor error 42 Indoor Error High
17/06/26   11:10 CALL CENTER 5_9P-C (084) 09P-C_4_1 Indoor error 42 Indoor Error High
17/06/26   11:10 VENDAS 3_9P-C (085) 09P-C_4_1 Indoor error 42 Indoor Error High
17/06/26   11:10 VENDAS 1_9P-C (086) 09P-C_4_1 Indoor error 42 Indoor Error High
17/06/26   11:10 VENDAS 2_9P-C (087) 09P-C_4_1 Indoor error 42 Indoor Error High
17/06/26   07:37 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
17/06/26   07:00 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
17/06/26   06:20 L6.06F.0165_7P-D (06F) 07P-D_3 Indoor error 4 Indoor unit drain overflow error. Indoor Error High
16/06/26   18:35 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
16/06/26   18:35 L4.0C0.0166_13P-C (0C0) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0C1.0166_13P-C (0C1) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0C2.0166_13P-C (0C2) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0C3.0166_13P-C (0C3) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0C4.0166_13P-C (0C4) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0C5.0166_13P-C (0C5) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0C6.0166_13P-C (0C6) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0C7.0166_13P-C (0C7) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0E0.1235_13P-C (0E0) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0E1.1235_13P-C (0E1) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0E2.1235_13P-C (0E2) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0E3.1235_13P-C (0E3) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   18:35 L4.0E4.1235_13P-C (0E4) 13P-C_4_9 Indoor error 53 Indoor Error High
16/06/26   12:23 multiple 09P-C_4_1 Units disconnected Units disconnected High
16/06/26   12:23 multiple 09P-C_4_1 Units disconnected Units disconnected High
16/06/26   12:08 14P-A_MAIN 14P-A_A(10) Outdoor error 53 Outdoor Error High
16/06/26   11:31 ODU L4.C00.0D80 9P-B_C(12) Outdoor error 53 Outdoor Error High
16/06/26   09:49 09P-C_MAIN 09P-C_4_1 Outdoor error 53 Outdoor Error High
16/06/26   09:12 multiple 09P-C_4_1 Units disconnected Units disconnected High
16/06/26   05:45 NOBREAK_4P-C (035) 04P-C_7 Indoor error 10 Indoor unit BLDC fan motor communications error. Indoor Error High
15/06/26   18:05 L4.0C0.0166_13P-C (0C0) 13P-C_4_9 Indoor error 53 Indoor Error High
15/06/26   18:05 L4.0C1.0166_13P-C (0C1) 13P-C_4_9 Indoor error 53 Indoor Error High
15/06/26   18:05 L4.0C6.0166_13P-C (0C6) 13P-C_4_9 Indoor error 53 Indoor Error High
15/06/26   18:05 L4.0C7.0166_13P-C (0C7) 13P-C_4_9 Indoor error 53 Indoor Error High
15/06/26   18:05 L4.0E0.1235_13P-C (0E0) 13P-C_4_9 Indoor error 53 Indoor Error High
15/06/26   18:01 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
15/06/26   17:23 ODU L6.900.1235 05P-C_9 Outdoor error 53 Outdoor Error High
15/06/26   17:22 ODU L6.900.1235 05P-C_9 Outdoor error 150 Outdoor Error High
15/06/26   16:36 ODU L6.900.1235 05P-C_9 Outdoor error 53 Outdoor Error High
15/06/26   16:35 ODU L6.900.1235 05P-C_9 Outdoor error 150 Outdoor Error High
15/06/26   09:30 CALL CENTER 1_9P-C (080) 09P-C_4_1 Indoor error 53 Indoor Error High
15/06/26   09:30 CALL CENTER 2_9P-C (081) 09P-C_4_1 Indoor error 53 Indoor Error High
15/06/26   09:30 CALL CENTER 3_9P-C (082) 09P-C_4_1 Indoor error 53 Indoor Error High
15/06/26   09:30 CALL CENTER 4_9P-C (083) 09P-C_4_1 Indoor error 53 Indoor Error High
15/06/26   09:30 CALL CENTER 5_9P-C (084) 09P-C_4_1 Indoor error 53 Indoor Error High
15/06/26   09:30 VENDAS 3_9P-C (085) 09P-C_4_1 Indoor error 53 Indoor Error High
15/06/26   09:30 VENDAS 1_9P-C (086) 09P-C_4_1 Indoor error 53 Indoor Error High
15/06/26   09:30 VENDAS 2_9P-C (087) 09P-C_4_1 Indoor error 53 Indoor Error High
15/06/26   00:05 L4.0C0.0166_13P-C (0C0) 13P-C_4_9 Indoor error 53 Indoor Error High
15/06/26   00:05 L4.0C1.0166_13P-C (0C1) 13P-C_4_9 Indoor error 53 Indoor Error High
15/06/26   00:05 L4.0C6.0166_13P-C (0C6) 13P-C_4_9 Indoor error 53 Indoor Error High
15/06/26   00:05 L4.0C7.0166_13P-C (0C7) 13P-C_4_9 Indoor error 53 Indoor Error High
15/06/26   00:05 L4.0E0.1235_13P-C (0E0) 13P-C_4_9 Indoor error 53 Indoor Error High
15/06/26   00:03 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
14/06/26   23:08 6P-D-MAIN 06P-D_1 Outdoor error 116 Outdoor Error High
14/06/26   23:04 6P-D-MAIN 06P-D_1 Outdoor error 21 Outdoor Error High
14/06/26   19:25 L4.0C0.0166_13P-C (0C0) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:25 L4.0C1.0166_13P-C (0C1) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:25 L4.0C6.0166_13P-C (0C6) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:25 L4.0C7.0166_13P-C (0C7) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:25 L4.0E0.1235_13P-C (0E0) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:20 L4.0C2.0166_13P-C (0C2) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:20 L4.0C3.0166_13P-C (0C3) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:20 L4.0C4.0166_13P-C (0C4) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:20 L4.0C5.0166_13P-C (0C5) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:20 L4.0E1.1235_13P-C (0E1) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:20 L4.0E2.1235_13P-C (0E2) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:20 L4.0E3.1235_13P-C (0E3) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:20 L4.0E4.1235_13P-C (0E4) 13P-C_4_9 Indoor error 53 Indoor Error High
14/06/26   19:20 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
14/06/26   03:27 6P-D-MAIN 06P-D_1 Outdoor error 116 Outdoor Error High
14/06/26   03:25 6P-D-MAIN 06P-D_1 Outdoor error 26 Outdoor Error High
14/06/26   02:32 6P-D-MAIN 06P-D_1 Outdoor error 116 Outdoor Error High
14/06/26   02:30 6P-D-MAIN 06P-D_1 Outdoor error 26 Outdoor Error High
13/06/26   14:10 L4.0C0.0166_13P-C (0C0) 13P-C_4_9 Indoor error 53 Indoor Error High
13/06/26   14:10 L4.0C1.0166_13P-C (0C1) 13P-C_4_9 Indoor error 53 Indoor Error High
13/06/26   14:10 L4.0C6.0166_13P-C (0C6) 13P-C_4_9 Indoor error 53 Indoor Error High
13/06/26   14:10 L4.0C7.0166_13P-C (0C7) 13P-C_4_9 Indoor error 53 Indoor Error High
13/06/26   14:10 L4.0E0.1235_13P-C (0E0) 13P-C_4_9 Indoor error 53 Indoor Error High
13/06/26   14:07 ODU L4.900.1235 13P-C_4_9 Outdoor error 53 Outdoor Error High
13/06/26   12:57 ODU L4.800.1235 13P-A_4_8 Outdoor error 53 Outdoor Error High
`.trim()

function slugify(value: string) {
  return normalizeLabel(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function normalizeLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(\w+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toIsoDate(date: string, time: string) {
  const [day, month, year] = date.split('/')
  return `20${year}-${month}-${day} ${time}`
}

function toMonthKey(date: string) {
  const [, month, year] = date.split('/')
  return `20${year}-${month}`
}

function toMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-')
  const map: Record<string, string> = {
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

  return `${map[month]}/${year.slice(2)}`
}

function getSystemId(systemName: string) {
  const baseSystem = westCorpSystems.find((item) => normalizeLabel(systemName).includes(normalizeLabel(item.systemName)))
  return baseSystem?.id ?? slugify(systemName)
}

function parseRawLogLine(line: string): RawWestCorpLog | null {
  const match = line.match(/^(\d{2}\/\d{2}\/\d{2})\s+(\d{2}:\d{2})\s+(.+)$/)
  if (!match) {
    return null
  }

  const [, date, time, remainder] = match
  const priorityMatch = remainder.match(/\s+(High|Medium|Low)$/)
  if (!priorityMatch) {
    return null
  }

  const priority = priorityMatch[1] as RawWestCorpLog['priority']
  const withoutPriority = remainder.slice(0, priorityMatch.index).trim()

  const alertTypeOptions = ['Outdoor Error', 'Indoor Error', 'Units disconnected']
  const alertType = alertTypeOptions.find((option) => withoutPriority.endsWith(option))
  if (!alertType) {
    return null
  }

  const withoutAlertType = withoutPriority.slice(0, -alertType.length).trim()
  const descriptionOptions = ['Outdoor error', 'Indoor error', 'Units disconnected']
  const description = descriptionOptions.find((option) => withoutAlertType.includes(` ${option} `) || withoutAlertType.endsWith(` ${option}`))
  if (!description) {
    return null
  }

  const descriptionIndex = withoutAlertType.indexOf(description)
  const unitAndSystem = withoutAlertType.slice(0, descriptionIndex).trim()
  const tail = withoutAlertType.slice(descriptionIndex + description.length).trim()

  const sortedSystems = [...westCorpSystems.map((item) => item.systemName), 'multiple'].sort((a, b) => b.length - a.length)
  const matchedSystem = sortedSystems.find((systemName) => normalizeLabel(unitAndSystem).includes(normalizeLabel(systemName)))
  if (!matchedSystem) {
    return null
  }

  const normalizedUnitAndSystem = normalizeLabel(unitAndSystem)
  const normalizedSystem = normalizeLabel(matchedSystem)
  const systemIndex = normalizedUnitAndSystem.indexOf(normalizedSystem)
  const rawParts = unitAndSystem.split(/\s+/)
  const systemName = matchedSystem === 'multiple'
    ? (unitAndSystem.includes(' multiple') ? 'multiple' : matchedSystem)
    : matchedSystem

  let unitName = unitAndSystem
  if (matchedSystem === 'multiple' && rawParts.length >= 2) {
    unitName = rawParts[0]
  } else if (systemIndex > -1) {
    const before = unitAndSystem.slice(0, unitAndSystem.toLowerCase().indexOf(matchedSystem.toLowerCase())).trim()
    unitName = before || unitAndSystem.replace(matchedSystem, '').trim()
  }

  const errorMatch = tail.match(/^(\d+)?\s*(.*)$/)
  const errorCode = errorMatch?.[1] ?? ''
  const errorDescription = errorMatch?.[2]?.trim() ?? ''

  return {
    date,
    time,
    unitName: unitName.trim() || 'multiple',
    systemName,
    description,
    errorCode,
    errorDescription,
    alertType,
    priority,
  }
}

export const westCorpRawLogs: RawWestCorpLog[] = RAW_LOG_LINES
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map(parseRawLogLine)
  .filter((entry): entry is RawWestCorpLog => entry !== null)

function buildAlarmMessage(entry: RawWestCorpLog) {
  const codeText = entry.errorCode ? `codigo ${entry.errorCode}` : 'sem codigo informado'
  const detailText = entry.errorDescription ? ` ${entry.errorDescription}` : ''
  return `${entry.alertType} no sistema ${entry.systemName} com ${codeText}.${detailText}`.trim()
}

const recurrenceMap = westCorpRawLogs.reduce<Map<string, number>>((accumulator, entry) => {
  const key = [entry.systemName, normalizeLabel(entry.unitName), entry.description, entry.errorCode || 'na', entry.alertType].join('|')
  accumulator.set(key, (accumulator.get(key) ?? 0) + 1)
  return accumulator
}, new Map())

const westCorpAlarms: Alarm[] = westCorpRawLogs.map((entry, index) => {
  const recurrenceKey = [entry.systemName, normalizeLabel(entry.unitName), entry.description, entry.errorCode || 'na', entry.alertType].join('|')
  const recurrence = recurrenceMap.get(recurrenceKey) ?? 1
  const equipmentId = `west-system-${getSystemId(entry.systemName)}`

  return {
    id: `west-alarm-${index + 1}`,
    equipmentId,
    equipmentName: entry.unitName === 'multiple' ? entry.systemName : entry.unitName,
    type: 'critical',
    message: buildAlarmMessage(entry),
    status: recurrence > 1 || entry.alertType === 'Units disconnected' ? 'pending_followup' : 'open',
    priority: entry.priority === 'High' ? 1 : entry.priority === 'Medium' ? 2 : 3,
    createdAt: toIsoDate(entry.date, entry.time),
    updatedAt: toIsoDate(entry.date, entry.time),
    clientName: WEST_CORP_CLIENT,
    areaName: entry.systemName,
    hasFollowup: recurrence > 1 || entry.alertType === 'Units disconnected',
    followupCount: recurrence,
  }
})

type SystemMonthMetrics = {
  monthKey: string
  systemName: string
  systemId: string
  totalAlerts: number
  outdoorAlerts: number
  disconnectAlerts: number
  uniqueUnits: Set<string>
  firstDate: string
  lastDate: string
}

const groupedSystemMonthMetrics = westCorpRawLogs.reduce<Map<string, SystemMonthMetrics>>((accumulator, entry) => {
  const monthKey = toMonthKey(entry.date)
  const systemId = getSystemId(entry.systemName)
  const key = `${monthKey}|${systemId}`
  const current = accumulator.get(key) ?? {
    monthKey,
    systemName: entry.systemName,
    systemId,
    totalAlerts: 0,
    outdoorAlerts: 0,
    disconnectAlerts: 0,
    uniqueUnits: new Set<string>(),
    firstDate: toIsoDate(entry.date, entry.time),
    lastDate: toIsoDate(entry.date, entry.time),
  }

  current.totalAlerts += 1
  current.outdoorAlerts += entry.alertType === 'Outdoor Error' ? 1 : 0
  current.disconnectAlerts += entry.alertType === 'Units disconnected' ? 1 : 0
  current.uniqueUnits.add(normalizeLabel(entry.unitName))
  current.lastDate = toIsoDate(entry.date, entry.time)
  accumulator.set(key, current)
  return accumulator
}, new Map())

function buildSystemSnapshot(metrics: SystemMonthMetrics): EquipmentMonthlySnapshot {
  const severityIndex =
    metrics.totalAlerts * 1.7 +
    metrics.outdoorAlerts * 1.2 +
    metrics.disconnectAlerts * 3.5 +
    metrics.uniqueUnits.size * 0.35

  const health = clamp(98 - severityIndex, 46, 99)
  const availability = clamp(99 - metrics.totalAlerts * 1.15 - metrics.disconnectAlerts * 4.5 - metrics.outdoorAlerts * 0.8, 52, 99)
  const comfort = clamp(97 - (metrics.totalAlerts - metrics.outdoorAlerts) * 0.9 - metrics.disconnectAlerts * 3, 55, 99)
  const performance = clamp(98 - metrics.totalAlerts * 1.05 - metrics.outdoorAlerts * 1.1 - metrics.disconnectAlerts * 2.5, 54, 99)
  const mttr = Number(clamp(1.8 + metrics.outdoorAlerts * 0.7 + metrics.disconnectAlerts * 1.3 + metrics.totalAlerts * 0.04, 1.8, 18).toFixed(2))

  return {
    id: `west-system-${metrics.systemId}`,
    name: metrics.systemName,
    type: 'VRV',
    area: WEST_CORP_SITE_NAME,
    client: WEST_CORP_CLIENT,
    siteId: WEST_CORP_SITE_ID,
    health: Number(health.toFixed(2)),
    availability: Number(availability.toFixed(2)),
    comfort: Number(comfort.toFixed(2)),
    performance: Number(performance.toFixed(2)),
    status: getHealthStatusText(health) as EquipmentMonthlySnapshot['status'],
    mttr,
    totalOccurrences: metrics.totalAlerts,
    criticalOccurrences: metrics.totalAlerts,
    moderateOccurrences: 0,
    informativeOccurrences: 0,
    lastUpdated: metrics.lastDate.split(' ')[0],
    monthKey: metrics.monthKey,
    month: toMonthLabel(metrics.monthKey),
    startDate: metrics.firstDate.split(' ')[0],
    endDate: metrics.lastDate.split(' ')[0],
  }
}

const westCorpMonthlyEquipmentSnapshots: EquipmentMonthlySnapshot[] = Array.from(groupedSystemMonthMetrics.values())
  .map(buildSystemSnapshot)
  .sort((a, b) => a.monthKey.localeCompare(b.monthKey) || b.totalOccurrences - a.totalOccurrences)

const westCorpMonthlySummaries: MonthlySummary[] = Array.from(
  westCorpMonthlyEquipmentSnapshots.reduce<Map<string, EquipmentMonthlySnapshot[]>>((accumulator, snapshot) => {
    const current = accumulator.get(snapshot.monthKey) ?? []
    current.push(snapshot)
    accumulator.set(snapshot.monthKey, current)
    return accumulator
  }, new Map())
)
  .map(([monthKey, snapshots]) => {
    const count = snapshots.length || 1
    return {
      monthKey,
      month: toMonthLabel(monthKey),
      startDate: snapshots[0]?.startDate ?? `${monthKey}-01`,
      endDate: snapshots[snapshots.length - 1]?.endDate ?? `${monthKey}-30`,
      health: Number((snapshots.reduce((sum, item) => sum + item.health, 0) / count).toFixed(2)),
      target: 90,
      availability: Number((snapshots.reduce((sum, item) => sum + item.availability, 0) / count).toFixed(2)),
      mttr: Number((snapshots.reduce((sum, item) => sum + item.mttr, 0) / count).toFixed(2)),
      totalOccurrences: snapshots.reduce((sum, item) => sum + item.totalOccurrences, 0),
      affectedEquipment: snapshots.length,
    }
  })
  .sort((a, b) => a.monthKey.localeCompare(b.monthKey))

const unitRollupMap = westCorpRawLogs.reduce<Map<string, WestCorpUnitHealthRollup>>((accumulator, entry) => {
  const systemId = getSystemId(entry.systemName)
  const unitType: WestCorpUnitHealthRollup['unitType'] =
    entry.unitName === 'multiple' ? 'SYSTEM' : normalizeLabel(entry.unitName).includes('odu') || normalizeLabel(entry.unitName).includes('main') || normalizeLabel(entry.unitName).includes('sub')
      ? 'ODU'
      : 'IDU'
  const id = `${systemId}-${slugify(entry.unitName)}`
  const current = accumulator.get(id) ?? {
    id,
    unitName: entry.unitName,
    systemId,
    systemName: entry.systemName,
    unitType,
    totalAlerts: 0,
    health: 98,
    availability: 99,
    mttr: 1.2,
    status: 'Verde',
    lastAlertAt: toIsoDate(entry.date, entry.time),
  }

  current.totalAlerts += 1
  current.lastAlertAt = toIsoDate(entry.date, entry.time)
  accumulator.set(id, current)
  return accumulator
}, new Map())

const westCorpUnitHealthRollups: WestCorpUnitHealthRollup[] = Array.from(unitRollupMap.values())
  .map((item) => {
    const penalty = item.totalAlerts * (item.unitType === 'ODU' ? 3.2 : item.unitType === 'SYSTEM' ? 2.6 : 2.2)
    const health = clamp(98 - penalty, 40, 99)
    const availability = clamp(99 - item.totalAlerts * (item.unitType === 'SYSTEM' ? 2.1 : 1.7), 45, 99)
    const mttr = clamp(1.2 + item.totalAlerts * (item.unitType === 'ODU' ? 0.45 : 0.35), 1.2, 16)

    return {
      ...item,
      health: Number(health.toFixed(2)),
      availability: Number(availability.toFixed(2)),
      mttr: Number(mttr.toFixed(2)),
      status: getHealthStatusText(health) as WestCorpUnitHealthRollup['status'],
    }
  })
  .sort((a, b) => b.totalAlerts - a.totalAlerts || a.unitName.localeCompare(b.unitName))

/* =========================================================
 * BLOCO JULHO / 2026 — 193 agregados CH × Equipamento × Sistema
 * (dados complementares, preservados os de maio e junho acima)
 * =======================================================*/

type ChSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
type ChCategory = 'Critical Outdoor' | 'Outdoor' | 'Indoor' | 'Sensor' | 'Communication Error'

interface ChMeta {
  severity: ChSeverity
  category: ChCategory
  shortTitle: string
  impact: string
  description: string
}

const CH_METADATA: Record<string, ChMeta> = {
  CH21: { severity: 'Critical', category: 'Critical Outdoor', shortTitle: 'Inverter / Compressor', impact: 'Pode provocar indisponibilidade da unidade externa/sistema e perda de climatizacao.', description: 'Recorrencia no caminho Inverter/Compressor. Investigar eletrica do compressor, IPM/placa e cabeamento.' },
  CH29: { severity: 'Critical', category: 'Critical Outdoor', shortTitle: 'Corrente anormal inverter', impact: 'Indica sobrecarga no modulo de potencia / IPM, risco de falha catastrofica da ODU.', description: 'Medir correntes de fase do compressor, isolar fonte / condensador do DC bus e inspecionar modulo IPM.' },
  CH26: { severity: 'Critical', category: 'Critical Outdoor', shortTitle: 'Alta pressao sistema refrigeracao', impact: 'Em caso de reincidencia aciona segurancas e trava a ODU. Pode danificar compressor por sobrecarga termica.', description: 'Verificar condensacao, limpeza da serpentina, velocidade e integridade de ventiladores da ODU e carga de gas.' },
  CH23: { severity: 'Critical', category: 'Outdoor', shortTitle: 'Baixa pressao / falta de refrigerante', impact: 'Perda de capacidade de resfriamento e risco de retorno de liquido ao compressor.', description: 'Teste de estanqueidade, identificar vazamento e corrigir; repor carga de refrigerante conforme especificacao do equipamento.' },
  CH34: { severity: 'Critical', category: 'Outdoor', shortTitle: 'Falha unidade externa (ODU)', impact: 'Falha geral no controlador da unidade externa; indisponibilidade do sistema.', description: 'Ciclo de energia na ODU e nova leitura de parametros; persistindo, avaliar troca do modulo de controle da unidade externa.' },
  CH35: { severity: 'Critical', category: 'Outdoor', shortTitle: 'Temperatura descarga compressor alta', impact: 'Risco de queima do compressor e bloqueio por protecao termica.', description: 'Verificar carga de refrigerante, limpeza da serpentina externa, condicoes de ventilacao e operacao dos ventiladores de condensacao.' },
  CH77: { severity: 'Critical', category: 'Outdoor', shortTitle: 'Protecao eletrica ODU', impact: 'Protecao do inverter acionada por anomalia eletrica; indisponibilidade temporaria ou total da unidade.', description: 'Medir tensoes de entrada (L1 / L2 / L3), continuidade dos fusiveis, contatores e resistencia entre fases do compressor.' },
  CH150: { severity: 'High', category: 'Indoor', shortTitle: 'Falha unidade interna - geral', impact: 'Perda de climatizacao na area atendida pela IDU afetada.', description: 'Verificar fonte da IDU, fusiveis internos, placa de controle e comunicação com a unidade externa.' },
  CH151: { severity: 'High', category: 'Indoor', shortTitle: 'Falha controle ventilacao interna', impact: 'Ruido / vibracao ou fluxo de ar reduzido na unidade interna.', description: 'Inspecionar motor do ventilador da IDU, rotor, relé e placa de acionamento.' },
  CH02: { severity: 'High', category: 'Indoor', shortTitle: 'Falha unidade interna (IDU)', impact: 'Indisponibilidade pontual na unidade interna; conforto térmico comprometido no ambiente.', description: 'Diagnosticar modulo de interface da IDU, sensor NTC do evaporador, motor do ventilador e anomalias na expansao eletronica.' },
  CH04: { severity: 'High', category: 'Indoor', shortTitle: 'Controle frigorifico / ciclo defeituoso', impact: 'Oscilacao de temperatura no ambiente; ciclo curto ou degelo ineficiente.', description: 'Reavaliar set-point de operacao, parametros de degelo e integridade do sistema de expansao / valvula eletronica.' },
  CH10: { severity: 'High', category: 'Indoor', shortTitle: 'Anomalia unidade interna / evaporacao', impact: 'Formacao de gelo na serpentina e queda de desempenho na IDU.', description: 'Verificar velocidade do ventilador interno, filtros, diferencial de pressao no evaporador e funcionamento da expansao.' },
  CH53: { severity: 'High', category: 'Communication Error', shortTitle: 'Comunicacao entre unidades', impact: 'Perda de sincronia ODU ↔ IDU; comandos remotos nao refletem estado real do equipamento.', description: 'Reconectar e testar barramento de comunicacao (RS485/CAN); medir terminacao, aterramento e isolar ruidos em inversores proximos.' },
  CH62: { severity: 'High', category: 'Outdoor', shortTitle: 'Falha ODU / refrigeracao (critico)', impact: 'Queda severa de performance; bloqueio da unidade externa por anomalia de refrigeracao.', description: 'Diagnostico completo do ciclo de refrigeracao: alta/baixa pressao, superaquecimento e subresfriamento no ponto de projeto.' },
  CH42: { severity: 'Medium', category: 'Sensor', shortTitle: 'Sensor temperatura - anomalia', impact: 'Leitura enviesada pode induzir ciclagem incorreta e afetar conforto.', description: 'Comparar leitura do sensor com termometro de referencia, avaliar substituição do NTC e integridade do plug na placa.' },
  CH45: { severity: 'Medium', category: 'Sensor', shortTitle: 'Sensor / controle - alerta operacional', impact: 'Desvio entre set-point e temperatura ambiente; nao e parada imediata mas sinaliza desgaste.', description: 'Revisar calibracao de sensores, parametros de histerese e validar acionamento de valvulas de expansao e rele de compressor.' },
  CH60: { severity: 'Medium', category: 'Indoor', shortTitle: 'Unidade interna - alerta operacional', impact: 'Alarmes de comportamento da IDU sem parada imediata, mas com tendencia a reincidencia.', description: 'Limpeza de filtros, checagem de fluxo de ar e validação da placa de interface da unidade interna.' },
  CH52: { severity: 'Medium', category: 'Communication Error', shortTitle: 'Comunicacao / controle alerta', impact: 'Queda de pacote na comunicacao ou timeout pontual; nao paralisa imediatamente.', description: 'Ajustar parametros de barramento, terminacao e blindagem; evitar cabo paralelo a linha de forca.' },
  CH102: { severity: 'Low', category: 'Indoor', shortTitle: 'IDU - ocorrencia pontual baixa', impact: 'Ocorrencia com baixo impacto e baixa recorrencia na unidade interna.', description: 'Acompanhamento e manutencao preventiva na proxima parada programada.' },
}

const RAW_AGGREGATED_ROWS_JUL26: Array<{ chCode: string; equipmentName: string; systemLabel: string; occurrences: number }> = [
  { chCode: 'CH21', equipmentName: 'ODU 01P-B_0 10P-A_M(4)', systemLabel: '11P-A_4_4', occurrences: 3 },
  { chCode: 'CH21', equipmentName: 'ODU 01P-B_0 10P-A_M(1)', systemLabel: '11P-A_4_4', occurrences: 13 },
  { chCode: 'CH21', equipmentName: 'ODU 01P-B_0 10P-A_M(2)', systemLabel: '11P-A_4_4', occurrences: 8 },
  { chCode: 'CH21', equipmentName: 'ODU 01P-B_0 10P-A_M(3)', systemLabel: '11P-A_4_4', occurrences: 4 },
  { chCode: 'CH21', equipmentName: 'IDU 01P-B_0-S4', systemLabel: '11P-A_4_4', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 01P-B_0-S1', systemLabel: '11P-A_4_4', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 01P-B_0-S2', systemLabel: '11P-A_4_4', occurrences: 1 },
  { chCode: 'CH29', equipmentName: 'ODU 05P-C_9', systemLabel: '05P-C_9', occurrences: 19 },
  { chCode: 'CH29', equipmentName: 'IDU 05P-C_9-A1', systemLabel: '05P-C_9', occurrences: 33 },
  { chCode: 'CH29', equipmentName: 'IDU 05P-C_9-A2', systemLabel: '05P-C_9', occurrences: 79 },
  { chCode: 'CH29', equipmentName: 'IDU 05P-C_9-A3', systemLabel: '05P-C_9', occurrences: 7 },
  { chCode: 'CH29', equipmentName: 'IDU 05P-C_9-A4', systemLabel: '05P-C_9', occurrences: 2 },
  { chCode: 'CH29', equipmentName: 'IDU 05P-C_9-A5', systemLabel: '05P-C_9', occurrences: 4 },
  { chCode: 'CH29', equipmentName: 'IDU 05P-C_9-A6', systemLabel: '05P-C_9', occurrences: 5 },
  { chCode: 'CH53', equipmentName: 'ODU 07P-C_D(13) 8P-B_A(13)', systemLabel: '07P-C_D(13)', occurrences: 12 },
  { chCode: 'CH53', equipmentName: 'ODU 07P-C_D(13) 8P-B_A(14)', systemLabel: '07P-C_D(13)', occurrences: 21 },
  { chCode: 'CH53', equipmentName: 'ODU 07P-C_D(13) 8P-B_A(15)', systemLabel: '07P-C_D(13)', occurrences: 19 },
  { chCode: 'CH53', equipmentName: 'ODU 07P-C_D(13) 8P-B_A(16)', systemLabel: '07P-C_D(13)', occurrences: 22 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U1', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U2', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U3', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U4', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U5', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U6', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U7', systemLabel: '07P-C_D(13)', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U8', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U9', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U10', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U11', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U12', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'IDU 07P-C_D(13)-U13', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 6 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I1', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I2', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I3', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I4', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I5', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I6', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I7', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I8', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I9', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I10', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 06P-C_B(11)-I11', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 11P-A_4_4-U1', systemLabel: '11P-A_4_4', occurrences: 34 },
  { chCode: 'CH02', equipmentName: 'IDU 11P-A_4_4-U2', systemLabel: '11P-A_4_4', occurrences: 44 },
  { chCode: 'CH02', equipmentName: 'IDU 11P-A_4_4-U3', systemLabel: '11P-A_4_4', occurrences: 45 },
  { chCode: 'CH02', equipmentName: 'IDU 11P-A_4_4-U4', systemLabel: '11P-A_4_4', occurrences: 39 },
  { chCode: 'CH02', equipmentName: 'IDU 13P-A_4_8-U1', systemLabel: '13P-A_4_8', occurrences: 4 },
  { chCode: 'CH02', equipmentName: 'IDU 13P-A_4_8-U2', systemLabel: '13P-A_4_8', occurrences: 4 },
  { chCode: 'CH02', equipmentName: 'IDU 13P-A_4_8-U3', systemLabel: '13P-A_4_8', occurrences: 3 },
  { chCode: 'CH02', equipmentName: 'IDU 13P-A_4_8-U4', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U1', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U2', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U3', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U4', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U5', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U6', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U7', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U8', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U9', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U10', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U11', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 09P-B_C(12)V-U12', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 14P-A_A(10)V-U1', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 14P-A_A(10)V-U2', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 14P-A_A(10)V-U3', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 14P-A_A(10)V-U4', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 14P-A_A(10)V-U5', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 14P-A_A(10)V-U6', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 14P-A_A(10)V-U7', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 14P-A_A(10)V-U8', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 14P-A_A(10)V-U9', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 14P-A_A(10)V-U10', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S7', systemLabel: '11P-A_4_4', occurrences: 13 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S8', systemLabel: '11P-A_4_4', occurrences: 28 },
  { chCode: 'CH23', equipmentName: 'ODU 01P-B_0 10P-A_M(4)', systemLabel: '11P-A_4_4', occurrences: 1 },
  { chCode: 'CH35', equipmentName: 'ODU 01P-B_0 10P-A_M(1)', systemLabel: '11P-A_4_4', occurrences: 1 },
  { chCode: 'CH62', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH151', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH04', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH10', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH34', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 2 },
  { chCode: 'CH35', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 2 },
  { chCode: 'CH29', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH77', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH150', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 4 },
  { chCode: 'CH21', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 2 },
  { chCode: 'CH42', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH45', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH102', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH60', equipmentName: 'ODU 11P-B_4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ODU 06P-D_1 13P-C_A', systemLabel: '06P-D_1', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'ODU 06P-D_1 13P-C_A(2)', systemLabel: '06P-D_1', occurrences: 3 },
  { chCode: 'CH53', equipmentName: 'ODU 06P-D_1 13P-C_A(3)', systemLabel: '06P-D_1', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'ODU 06P-D_1 13P-C_A(4)', systemLabel: '06P-D_1', occurrences: 3 },
  { chCode: 'CH53', equipmentName: 'ODU 06P-D_1 13P-C_A(5)', systemLabel: '06P-D_1', occurrences: 2 },
  { chCode: 'CH53', equipmentName: 'IDU 06P-D_1-U1', systemLabel: '06P-D_1', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'IDU 06P-D_1-U2', systemLabel: '06P-D_1', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'IDU 06P-D_1-U3', systemLabel: '06P-D_1', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'IDU 06P-D_1-U4', systemLabel: '06P-D_1', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'ODU 15P-A_2_3(11)', systemLabel: '15P-A_2_3(11)', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'ODU 15P-A_2_3(11)', systemLabel: '15P-A_2_3(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ODU 12P-C_B(11)', systemLabel: '12P-C_B(11)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ODU 15P-C_A(10)', systemLabel: '15P-C_A(10)', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ODU 01P-A_1', systemLabel: '01P-A_1', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ODU 01P-B_0 10P-A_M(5)', systemLabel: '11P-A_4_4', occurrences: 2 },
  { chCode: 'CH29', equipmentName: 'ODU 01P-B_0 10P-A_M(4)', systemLabel: '11P-A_4_4', occurrences: 2 },
  { chCode: 'CH29', equipmentName: 'IDU 01P-B_0-S3', systemLabel: '11P-A_4_4', occurrences: 2 },
  { chCode: 'CH29', equipmentName: 'IDU 01P-B_0-S5', systemLabel: '11P-A_4_4', occurrences: 2 },
  { chCode: 'CH29', equipmentName: 'IDU 01P-B_0-S6', systemLabel: '11P-A_4_4', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 13P-A_4_8-U1', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 13P-A_4_8-U2', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 13P-A_4_8-U3', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 13P-A_4_8-U4', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 13P-A_4_8-U5', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 13P-A_4_8-U6', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 13P-A_4_8-U7', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 13P-A_4_8-U8', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH23', equipmentName: 'IDU 07P-C_D(13)-U14', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH23', equipmentName: 'IDU 07P-C_D(13)-U15', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH23', equipmentName: 'IDU 07P-C_D(13)-U16', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 07P-C_D(13)-U14', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 07P-C_D(13)-U15', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'IDU 07P-C_D(13)-U16', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH34', equipmentName: 'IDU 07P-C_D(13)-U14', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH34', equipmentName: 'IDU 07P-C_D(13)-U15', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH34', equipmentName: 'IDU 07P-C_D(13)-U16', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH35', equipmentName: 'IDU 07P-C_D(13)-U14', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH35', equipmentName: 'IDU 07P-C_D(13)-U15', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH35', equipmentName: 'IDU 07P-C_D(13)-U16', systemLabel: '07P-C_D(13)', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'ODU 13P-A_4_8', systemLabel: '13P-A_4_8', occurrences: 2 },
  { chCode: 'CH29', equipmentName: 'ODU 13P-A_4_8', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ODU 13P-A_4_8', systemLabel: '13P-A_4_8', occurrences: 1 },
  { chCode: 'CH62', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH150', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH151', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH04', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH10', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH29', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH45', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'ODU 09P-B_C(12)V', systemLabel: '9P-B_C(12)V', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'ODU 06P-D_1 13P-C_A', systemLabel: '06P-D_1', occurrences: 1 },
  { chCode: 'CH62', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 2 },
  { chCode: 'CH150', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH151', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH04', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH10', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH45', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH34', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH23', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH35', equipmentName: 'ODU 14P-A_A(10)V', systemLabel: '14P-A_A(10)V', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'ODU 01P-B_0 10P-A_M(2)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH29', equipmentName: 'ODU 01P-B_0 10P-A_M(3)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH53', equipmentName: 'ODU 01P-B_0 10P-A_M(2)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'ODU 01P-B_0 10P-A_M(3)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH04', equipmentName: 'ODU 01P-B_0 10P-A_M(4)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH10', equipmentName: 'ODU 01P-B_0 10P-A_M(4)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH62', equipmentName: 'ODU 01P-B_0 10P-A_M(1)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH77', equipmentName: 'ODU 01P-B_0 10P-A_M(1)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH150', equipmentName: 'ODU 01P-B_0 10P-A_M(2)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH151', equipmentName: 'ODU 01P-B_0 10P-A_M(2)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'ODU 01P-B_0 10P-A_M(3)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH45', equipmentName: 'ODU 01P-B_0 10P-A_M(3)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH34', equipmentName: 'ODU 01P-B_0 10P-A_M(4)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH23', equipmentName: 'ODU 01P-B_0 10P-A_M(5)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH26', equipmentName: 'ODU 01P-B_0 10P-A_M(5)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH35', equipmentName: 'ODU 01P-B_0 10P-A_M(5)', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S1', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S2', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S3', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S4', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S5', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S6', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S7', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S8', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S9', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH02', equipmentName: 'IDU 01P-B_0-S10', systemLabel: '01P-B_0', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 11P-B_4-C1', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 11P-B_4-C2', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 11P-B_4-C3', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'IDU 11P-B_4-C4', systemLabel: '11P-B_4', occurrences: 1 },
  { chCode: 'CH62', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH77', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH150', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH151', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH04', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH10', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH21', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 2 },
  { chCode: 'CH29', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 2 },
  { chCode: 'CH23', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH34', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH35', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH42', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH45', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
  { chCode: 'CH52', equipmentName: 'ODU 06P-C_B(11) 10P-C_B(11)', systemLabel: '06P-C_B(11)', occurrences: 1 },
]

const PEAK_SYSTEMS_BY_CH: Record<string, number[]> = {
  CH21: [14, 15, 16, 17, 18, 19, 20, 21],
  CH29: [14, 15, 16, 17, 18, 19, 20, 21],
  CH26: [13, 14, 15, 16],
  CH23: [16, 17, 18],
  CH34: [20, 21, 22],
  CH35: [18, 19, 20, 21],
  CH77: [21],
  CH150: [23, 24, 25],
  CH151: [23, 24, 25],
  CH02: [22, 23, 24, 25, 26, 27, 28],
  CH04: [19, 20, 21],
  CH10: [19, 20, 21],
  CH53: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
  CH62: [11, 12, 13],
  CH42: [9, 10, 11],
  CH45: [10, 11, 12],
  CH60: [26, 27, 28],
  CH52: [4, 5, 6, 7],
  CH102: [30],
}

function seededHash(a: string, b: string, c: string): number {
  const base = `${a}|${b}|${c}`
  let hash = 0
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function getOccurrenceIsoDate(chCode: string, rowHash: number, occurrenceIndex: number, totalOccurrences: number): string {
  const peaks = PEAK_SYSTEMS_BY_CH[chCode] ?? [1, 2, 3, 4, 5, 6, 7]
  const bucketSize = Math.ceil(totalOccurrences / peaks.length) || 1
  const peakIndex = Math.min(Math.floor(occurrenceIndex / bucketSize), peaks.length - 1)
  const day = peaks[peakIndex]
  const hourShift = seededHash(`${chCode}-occ`, `${rowHash}`, `${occurrenceIndex}`) % 11
  const hour = 8 + hourShift
  const minute = seededHash(`${chCode}-min`, `${rowHash}`, `${occurrenceIndex}`) % 60
  const mm = String(minute).padStart(2, '0')
  const hh = String(hour).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `2026-07-${dd} ${hh}:${mm}:00`
}

interface Jul26ExpandedSeed {
  chCode: string
  equipmentName: string
  systemLabel: string
  createdAt: string
  meta: ChMeta
}

const EXPANDED_SEEDS_JUL26: Jul26ExpandedSeed[] = RAW_AGGREGATED_ROWS_JUL26
  .flatMap((row) => {
    const meta = CH_METADATA[row.chCode] ?? { severity: 'Medium', category: 'Indoor', shortTitle: row.chCode, impact: 'Sem descricao fornecida', description: 'Alerta sem classificacao detalhada; revisar manualmente.' }
    const hash = seededHash(row.chCode, row.equipmentName, row.systemLabel)
    return Array.from({ length: row.occurrences }).map((_, idx) => ({
      chCode: row.chCode,
      equipmentName: row.equipmentName,
      systemLabel: row.systemLabel,
      createdAt: getOccurrenceIsoDate(row.chCode, hash, idx, row.occurrences),
      meta,
    }))
  })
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

const RECURRENCE_JUL26 = EXPANDED_SEEDS_JUL26.reduce<Map<string, number>>((acc, seed) => {
  const key = [seed.systemLabel, seed.equipmentName, seed.chCode].join('|')
  acc.set(key, (acc.get(key) ?? 0) + 1)
  return acc
}, new Map())

const BASE_ALARM_ID_JUL26_PREFIX = 'wc-jul26'

const ALARMS_JUL26: Alarm[] = EXPANDED_SEEDS_JUL26.map((seed, index) => {
  const recurrenceKey = [seed.systemLabel, seed.equipmentName, seed.chCode].join('|')
  const recurrence = RECURRENCE_JUL26.get(recurrenceKey) ?? 1
  const systemId = getSystemId(seed.systemLabel)
  const criticality = seed.meta.severity === 'Critical' ? 1 : seed.meta.severity === 'High' ? 1 : seed.meta.severity === 'Medium' ? 2 : 3
  const type: Alarm['type'] = seed.meta.severity === 'Critical' ? 'critical' : seed.meta.severity === 'High' ? 'critical' : seed.meta.severity === 'Medium' ? 'warning' : 'info'
  const message = `${seed.chCode} - ${seed.meta.shortTitle} em ${seed.equipmentName} (${seed.systemLabel}): ${seed.meta.impact}`
  const hasFollowup = recurrence > 1 || seed.meta.severity === 'Critical'
  return {
    id: `${BASE_ALARM_ID_JUL26_PREFIX}-${index + 1}`,
    equipmentId: `west-system-${systemId}`,
    equipmentName: seed.equipmentName,
    type,
    message,
    status: hasFollowup ? 'pending_followup' : 'open',
    priority: criticality,
    createdAt: seed.createdAt,
    updatedAt: seed.createdAt,
    clientName: WEST_CORP_CLIENT,
    areaName: seed.systemLabel,
    hasFollowup,
    followupCount: recurrence,
    errorCode: seed.chCode,
    errorCategory: seed.meta.category,
    rawCode: seed.chCode,
  }
})

type Jul26SystemMonthMetrics = {
  monthKey: string
  systemName: string
  systemId: string
  totalAlerts: number
  outdoorAlerts: number
  disconnectAlerts: number
  criticalCount: number
  moderateCount: number
  uniqueUnits: Set<string>
  firstDate: string
  lastDate: string
}

const JUL26_SYSTEM_METRICS = EXPANDED_SEEDS_JUL26.reduce<Map<string, Jul26SystemMonthMetrics>>((acc, seed) => {
  const monthKey = '2026-07'
  const systemId = getSystemId(seed.systemLabel)
  const key = `${monthKey}|${systemId}`
  const isOutdoor = seed.meta.category.includes('Outdoor')
  const isDisconnect = seed.meta.category === 'Communication Error' && seed.chCode === 'CH53'
  const critical = seed.meta.severity === 'Critical' || seed.meta.severity === 'High'
  const moderate = seed.meta.severity === 'Medium'
  const current = acc.get(key) ?? {
    monthKey,
    systemName: seed.systemLabel,
    systemId,
    totalAlerts: 0,
    outdoorAlerts: 0,
    disconnectAlerts: 0,
    criticalCount: 0,
    moderateCount: 0,
    uniqueUnits: new Set<string>(),
    firstDate: seed.createdAt,
    lastDate: seed.createdAt,
  }
  current.totalAlerts += 1
  current.outdoorAlerts += isOutdoor ? 1 : 0
  current.disconnectAlerts += isDisconnect ? 1 : 0
  current.criticalCount += critical ? 1 : 0
  current.moderateCount += moderate ? 1 : 0
  current.uniqueUnits.add(normalizeLabel(seed.equipmentName))
  current.lastDate = seed.createdAt
  acc.set(key, current)
  return acc
}, new Map())

function buildJul26SystemSnapshot(metrics: Jul26SystemMonthMetrics): EquipmentMonthlySnapshot {
  const severityIndex =
    metrics.criticalCount * 2.1 +
    metrics.outdoorAlerts * 1.2 +
    metrics.disconnectAlerts * 3.5 +
    metrics.uniqueUnits.size * 0.35

  const health = clamp(98 - severityIndex, 46, 99)
  const availability = clamp(99 - metrics.criticalCount * 1.15 - metrics.disconnectAlerts * 4.5 - metrics.outdoorAlerts * 0.8, 52, 99)
  const comfort = clamp(97 - Math.max(0, metrics.totalAlerts - metrics.outdoorAlerts) * 0.9 - metrics.disconnectAlerts * 3, 55, 99)
  const performance = clamp(98 - metrics.totalAlerts * 1.05 - metrics.outdoorAlerts * 1.1 - metrics.disconnectAlerts * 2.5, 54, 99)
  const mttr = Number(clamp(1.8 + metrics.outdoorAlerts * 0.7 + metrics.disconnectAlerts * 1.3 + metrics.totalAlerts * 0.04, 1.8, 18).toFixed(2))
  return {
    id: `west-system-${metrics.systemId}`,
    name: metrics.systemName,
    type: 'VRV',
    area: WEST_CORP_SITE_NAME,
    client: WEST_CORP_CLIENT,
    siteId: WEST_CORP_SITE_ID,
    health: Number(health.toFixed(2)),
    availability: Number(availability.toFixed(2)),
    comfort: Number(comfort.toFixed(2)),
    performance: Number(performance.toFixed(2)),
    status: getHealthStatusText(health) as EquipmentMonthlySnapshot['status'],
    mttr,
    totalOccurrences: metrics.totalAlerts,
    criticalOccurrences: metrics.criticalCount,
    moderateOccurrences: metrics.moderateCount,
    informativeOccurrences: Math.max(0, metrics.totalAlerts - metrics.criticalCount - metrics.moderateCount),
    lastUpdated: metrics.lastDate.split(' ')[0],
    monthKey: metrics.monthKey,
    month: toMonthLabel(metrics.monthKey),
    startDate: metrics.firstDate.split(' ')[0],
    endDate: metrics.lastDate.split(' ')[0],
  }
}

const JUL26_MONTHLY_SNAPSHOTS: EquipmentMonthlySnapshot[] = Array.from(JUL26_SYSTEM_METRICS.values())
  .map(buildJul26SystemSnapshot)
  .sort((a, b) => a.monthKey.localeCompare(b.monthKey) || b.totalOccurrences - a.totalOccurrences)

const JUL26_MONTHLY_SUMMARIES: MonthlySummary[] = Array.from(
  JUL26_MONTHLY_SNAPSHOTS.reduce<Map<string, EquipmentMonthlySnapshot[]>>((acc, s) => {
    const cur = acc.get(s.monthKey) ?? []
    cur.push(s)
    acc.set(s.monthKey, cur)
    return acc
  }, new Map())
).map(([monthKey, snapshots]) => {
  const count = snapshots.length || 1
  return {
    monthKey,
    month: toMonthLabel(monthKey),
    startDate: snapshots[0]?.startDate ?? `${monthKey}-01`,
    endDate: snapshots[snapshots.length - 1]?.endDate ?? `${monthKey}-31`,
    health: Number((snapshots.reduce((sum, item) => sum + item.health, 0) / count).toFixed(2)),
    target: 90,
    availability: Number((snapshots.reduce((sum, item) => sum + item.availability, 0) / count).toFixed(2)),
    mttr: Number((snapshots.reduce((sum, item) => sum + item.mttr, 0) / count).toFixed(2)),
    totalOccurrences: snapshots.reduce((sum, item) => sum + item.totalOccurrences, 0),
    affectedEquipment: snapshots.length,
  }
})


const JUL26_UNIT_ROLLUP_MAP = EXPANDED_SEEDS_JUL26.reduce<Map<string, WestCorpUnitHealthRollup>>((acc, seed) => {
  const systemId = getSystemId(seed.systemLabel)
  const unitLabel = normalizeLabel(seed.equipmentName)
  const unitType: WestCorpUnitHealthRollup['unitType'] =
    unitLabel.includes('odu') || unitLabel.includes('master') || unitLabel.includes('slave') || unitLabel.includes('main') || unitLabel.includes('sub')
      ? 'ODU'
      : unitLabel.includes('idu')
        ? 'IDU'
        : unitLabel.startsWith('o') || seed.meta.category === 'Outdoor' || seed.meta.category === 'Critical Outdoor' || seed.chCode === 'CH21' || seed.chCode === 'CH29' || seed.chCode === 'CH26' || seed.chCode === 'CH34' || seed.chCode === 'CH35' || seed.chCode === 'CH62' || seed.chCode === 'CH53' || seed.chCode === 'CH77'
          ? 'ODU'
          : 'IDU'
  const id = `${systemId}-${slugify(seed.equipmentName)}`
  const current = acc.get(id) ?? {
    id,
    unitName: seed.equipmentName,
    systemId,
    systemName: seed.systemLabel,
    unitType,
    totalAlerts: 0,
    health: 98,
    availability: 99,
    mttr: 1.2,
    status: 'Verde',
    lastAlertAt: seed.createdAt,
  }
  current.totalAlerts += 1
  current.lastAlertAt = seed.createdAt
  acc.set(id, current)
  return acc
}, new Map())

const JUL26_UNIT_ROLLUPS: WestCorpUnitHealthRollup[] = Array.from(JUL26_UNIT_ROLLUP_MAP.values())
  .map((item) => {
    const penalty = item.totalAlerts * (item.unitType === 'ODU' ? 3.2 : item.unitType === 'SYSTEM' ? 2.6 : 2.2)
    const health = clamp(98 - penalty, 40, 99)
    const availability = clamp(99 - item.totalAlerts * (item.unitType === 'SYSTEM' ? 2.1 : 1.7), 45, 99)
    const mttr = clamp(1.2 + item.totalAlerts * (item.unitType === 'ODU' ? 0.45 : 0.35), 1.2, 16)
    return {
      ...item,
      health: Number(health.toFixed(2)),
      availability: Number(availability.toFixed(2)),
      mttr: Number(mttr.toFixed(2)),
      status: getHealthStatusText(health) as WestCorpUnitHealthRollup['status'],
    }
  })
  .sort((a, b) => b.totalAlerts - a.totalAlerts || a.unitName.localeCompare(b.unitName))

export const westCorpSystemsWithOccurrences: string[] = Array.from(
  new Set([...westCorpMonthlyEquipmentSnapshots.map((s) => s.name), ...JUL26_MONTHLY_SNAPSHOTS.map((s) => s.name)])
)

export function getWestCorpChMeta(chCode: string): ChMeta | undefined {
  return CH_METADATA[chCode]
}

/* =========================================================
 * MERGE FINAL: maio + junho + julho
 * =======================================================*/

export const __mergedWestCorpAlarms: Alarm[] = [...westCorpAlarms, ...ALARMS_JUL26]
export const __mergedWestCorpMonthlyEquipmentSnapshots: EquipmentMonthlySnapshot[] = [
  ...westCorpMonthlyEquipmentSnapshots,
  ...JUL26_MONTHLY_SNAPSHOTS,
].sort((a, b) => a.monthKey.localeCompare(b.monthKey) || b.totalOccurrences - a.totalOccurrences)

function mergeSummaries(prev: MonthlySummary[], jul: MonthlySummary[]): MonthlySummary[] {
  const combined = [...prev, ...jul]
  const byMonth = new Map<string, MonthlySummary[]>()
  combined.forEach((s) => {
    const arr = byMonth.get(s.monthKey) ?? []
    arr.push(s)
    byMonth.set(s.monthKey, arr)
  })
  return Array.from(byMonth.entries())
    .map(([monthKey, snaps]) => {
      const count = snaps.length || 1
      return {
        monthKey,
        month: snaps[0].month,
        startDate: snaps[0].startDate,
        endDate: snaps[snaps.length - 1].endDate,
        health: Number((snaps.reduce((sum, s) => sum + s.health, 0) / count).toFixed(2)),
        target: 90,
        availability: Number((snaps.reduce((sum, s) => sum + s.availability, 0) / count).toFixed(2)),
        mttr: Number((snaps.reduce((sum, s) => sum + s.mttr, 0) / count).toFixed(2)),
        totalOccurrences: snaps.reduce((sum, s) => sum + s.totalOccurrences, 0),
        affectedEquipment: snaps.reduce((max, s) => Math.max(max, s.affectedEquipment), 0),
      }
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

function mergeUnitRollups(prev: WestCorpUnitHealthRollup[], jul: WestCorpUnitHealthRollup[]): WestCorpUnitHealthRollup[] {
  const byId = new Map<string, WestCorpUnitHealthRollup>()
  ;[...prev, ...jul].forEach((rollup) => {
    const existing = byId.get(rollup.id)
    if (!existing) {
      byId.set(rollup.id, { ...rollup })
    } else {
      const totalAlerts = existing.totalAlerts + rollup.totalAlerts
      const penalty = totalAlerts * (rollup.unitType === 'ODU' ? 3.2 : rollup.unitType === 'SYSTEM' ? 2.6 : 2.2)
      const health = clamp(98 - penalty, 40, 99)
      const availability = clamp(99 - totalAlerts * (rollup.unitType === 'SYSTEM' ? 2.1 : 1.7), 45, 99)
      const mttr = clamp(1.2 + totalAlerts * (rollup.unitType === 'ODU' ? 0.45 : 0.35), 1.2, 16)
      byId.set(rollup.id, {
        ...existing,
        totalAlerts,
        health: Number(health.toFixed(2)),
        availability: Number(availability.toFixed(2)),
        mttr: Number(mttr.toFixed(2)),
        status: getHealthStatusText(health) as WestCorpUnitHealthRollup['status'],
        lastAlertAt: rollup.lastAlertAt > existing.lastAlertAt ? rollup.lastAlertAt : existing.lastAlertAt,
      })
    }
  })
  return Array.from(byId.values()).sort((a, b) => b.totalAlerts - a.totalAlerts || a.unitName.localeCompare(b.unitName))
}

export const __mergedWestCorpMonthlySummaries = mergeSummaries(westCorpMonthlySummaries, JUL26_MONTHLY_SUMMARIES)
export const __mergedWestCorpSiteMonthlySnapshots: SiteMonthlySnapshot[] = __mergedWestCorpMonthlySummaries.map((summary) => ({
  ...westCorpSite,
  saudeGeral: summary.health,
  disponibilidade: summary.availability,
  conforto: Number(clamp(summary.health + 1.5, 0, 100).toFixed(2)),
  performance: Number(clamp(summary.health + 0.8, 0, 100).toFixed(2)),
  ocorrenciasCriticas: summary.totalOccurrences,
  ultimaAtualizacao: summary.endDate.split('-').reverse().join('/'),
  monthKey: summary.monthKey,
  month: summary.month,
}))
export const __mergedWestCorpUnitHealthRollups = mergeUnitRollups(westCorpUnitHealthRollups, JUL26_UNIT_ROLLUPS)

/* sobrescreve os exports originais de maio/junho com o merge maio + junho + julho,
 * mantendo todos os consumidores (Dashboard / Alarms / Catalog / EquipmentHealth)
 * funcionando sem alterar os imports deles. */
export {
  __mergedWestCorpAlarms as westCorpAlarms,
  __mergedWestCorpMonthlyEquipmentSnapshots as westCorpMonthlyEquipmentSnapshots,
  __mergedWestCorpMonthlySummaries as westCorpMonthlySummaries,
  __mergedWestCorpSiteMonthlySnapshots as westCorpSiteMonthlySnapshots,
  __mergedWestCorpUnitHealthRollups as westCorpUnitHealthRollups,
}

