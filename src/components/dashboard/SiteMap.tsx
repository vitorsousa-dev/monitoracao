import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPinned } from 'lucide-react'
import { SiteLocation } from '@/types'

interface SiteMapProps {
  sites: SiteLocation[]
  periodLabel: string
}

function getSiteHealthColor(saudeGeral: number) {
  if (saudeGeral >= 90) {
    return '#22c55e'
  }

  if (saudeGeral >= 75) {
    return '#f5b700'
  }

  return '#ef4444'
}

function getSiteHealthLabel(saudeGeral: number) {
  if (saudeGeral >= 90) {
    return 'Saudavel'
  }

  if (saudeGeral >= 75) {
    return 'Atencao'
  }

  return 'Critico'
}

function formatMetric(value: number) {
  return `${value.toFixed(1)}%`
}

export function SiteMap({ sites, periodLabel }: SiteMapProps) {
  const georeferencedSites = sites.filter((site) => site.latitude !== null && site.longitude !== null)
  const pendingGeolocationSites = sites.filter((site) => site.latitude === null || site.longitude === null)

  const defaultCenter: LatLngExpression = [-23.586, -46.668]
  const mapCenter: LatLngExpression = georeferencedSites.length > 0
    ? [
        georeferencedSites.reduce((sum, site) => sum + (site.latitude ?? 0), 0) / georeferencedSites.length,
        georeferencedSites.reduce((sum, site) => sum + (site.longitude ?? 0), 0) / georeferencedSites.length,
      ]
    : defaultCenter

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900">Mapa Geolocalizado dos Sites</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            Visão consolidada dos sites e unidades do cliente no período {periodLabel}, com leitura rápida de saúde,
            disponibilidade e criticidade operacional.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Saúde &gt;= 90</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Saúde 75 a 89,9</span>
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">Saúde &lt; 75</span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
        <div className="h-[420px] w-full bg-slate-50">
          <MapContainer
            center={mapCenter}
            zoom={11}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {georeferencedSites.map((site) => {
              const color = getSiteHealthColor(site.saudeGeral)

              return (
                <CircleMarker
                  key={`${site.siteId}-${site.ultimaAtualizacao}`}
                  center={[site.latitude ?? 0, site.longitude ?? 0]}
                  radius={16}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.22,
                    weight: 2,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent={false}>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">{site.nome}</p>
                      <p className="text-xs text-gray-600">Saúde Geral: {formatMetric(site.saudeGeral)}</p>
                    </div>
                  </Tooltip>

                  <Popup minWidth={280}>
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{site.nome}</p>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{site.cliente}</p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Endereço</p>
                        <p className="mt-1 text-sm leading-6 text-gray-700">
                          {site.endereco}, {site.cidade} - {site.estado}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-gray-100 p-3">
                          <p className="text-xs text-gray-500">Saúde Geral</p>
                          <p className="mt-1 text-sm font-semibold" style={{ color }}>
                            {formatMetric(site.saudeGeral)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 p-3">
                          <p className="text-xs text-gray-500">Disponibilidade</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">{formatMetric(site.disponibilidade)}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 p-3">
                          <p className="text-xs text-gray-500">Conforto</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">{formatMetric(site.conforto)}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 p-3">
                          <p className="text-xs text-gray-500">Performance</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">{formatMetric(site.performance)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                        <div>
                          <p className="text-xs text-gray-500">Ocorrências críticas</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">{site.ocorrenciasCriticas}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Status</p>
                          <p className="mt-1 text-sm font-semibold" style={{ color }}>
                            {getSiteHealthLabel(site.saudeGeral)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sites.map((site) => (
            <div key={site.siteId} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{site.nome}</p>
                  <p className="mt-1 text-xs text-gray-500">{site.cidade} - {site.estado}</p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: `${getSiteHealthColor(site.saudeGeral)}1A`,
                    color: getSiteHealthColor(site.saudeGeral),
                  }}
                >
                  {formatMetric(site.saudeGeral)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">{site.endereco}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                  Disponibilidade {formatMetric(site.disponibilidade)}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                  Críticos {site.ocorrenciasCriticas}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">Cobertura geográfica</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {georeferencedSites.length} site(s) georreferenciado(s) no mapa e {pendingGeolocationSites.length} aguardando coordenadas.
          </p>
          {pendingGeolocationSites.length > 0 && (
            <div className="mt-3 space-y-2">
              {pendingGeolocationSites.map((site) => (
                <div key={site.siteId} className="rounded-lg border border-dashed border-gray-200 bg-white p-3">
                  <p className="text-sm font-medium text-gray-900">{site.nome}</p>
                  <p className="mt-1 text-xs text-gray-500">Latitude/longitude pendentes para futura integração.</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
