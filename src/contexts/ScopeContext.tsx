import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { mockSites } from '@/lib/mockData'
import { useAuth } from '@/hooks/useAuth'

type ScopeOption = {
  id: string
  label: string
}

interface ScopeContextType {
  selectedClient: string
  selectedSite: string
  availableClients: ScopeOption[]
  availableSites: ScopeOption[]
  canSelectAnyClient: boolean
  setSelectedClient: (value: string) => void
  setSelectedSite: (value: string) => void
}

const ALL_CLIENTS_VALUE = 'all-clients'
const ALL_SITES_VALUE = 'all-sites'

const ScopeContext = createContext<ScopeContextType | undefined>(undefined)

export function ScopeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const allClients = useMemo<ScopeOption[]>(() => {
    const uniqueClients = Array.from(new Set(mockSites.map((site) => site.cliente)))
    return uniqueClients.map((client) => ({
      id: client,
      label: client,
    }))
  }, [])

  const canSelectAnyClient = user?.role === 'admin'

  const allowedClients = useMemo<ScopeOption[]>(() => {
    if (!user) {
      return []
    }

    if (canSelectAnyClient) {
      return allClients
    }

    const allowed = new Set(user.clientAccess)
    return allClients.filter((client) => allowed.has(client.id))
  }, [allClients, canSelectAnyClient, user])

  const [selectedClient, setSelectedClientState] = useState<string>(ALL_CLIENTS_VALUE)
  const [selectedSite, setSelectedSiteState] = useState<string>(ALL_SITES_VALUE)

  useEffect(() => {
    if (!user) {
      return
    }

    if (canSelectAnyClient) {
      setSelectedClientState((current) => {
        if (current === ALL_CLIENTS_VALUE) {
          return current
        }

        const exists = allowedClients.some((client) => client.id === current)
        return exists ? current : ALL_CLIENTS_VALUE
      })
      return
    }

    const defaultClient = allowedClients[0]?.id ?? ALL_CLIENTS_VALUE
    setSelectedClientState(defaultClient)
  }, [allowedClients, canSelectAnyClient, user])

  const availableSites = useMemo<ScopeOption[]>(() => {
    const filteredSites = mockSites.filter((site) =>
      selectedClient === ALL_CLIENTS_VALUE ? true : site.cliente === selectedClient
    )

    return filteredSites.map((site) => ({
      id: site.siteId,
      label: site.nome,
    }))
  }, [selectedClient])

  useEffect(() => {
    setSelectedSiteState((current) => {
      if (current === ALL_SITES_VALUE) {
        return current
      }

      const exists = availableSites.some((site) => site.id === current)
      return exists ? current : ALL_SITES_VALUE
    })
  }, [availableSites])

  const setSelectedClient = (value: string) => {
    const nextClient =
      !user || !canSelectAnyClient
        ? allowedClients.some((client) => client.id === value)
          ? value
          : allowedClients[0]?.id ?? ALL_CLIENTS_VALUE
        : value

    if (nextClient === ALL_CLIENTS_VALUE) {
      setSelectedClientState(ALL_CLIENTS_VALUE)
      setSelectedSiteState(ALL_SITES_VALUE)
      return
    }

    setSelectedClientState(nextClient)
    setSelectedSiteState((current) => {
      if (current === ALL_SITES_VALUE) {
        return current
      }

      const currentSite = mockSites.find((site) => site.siteId === current)
      return currentSite?.cliente === nextClient ? current : ALL_SITES_VALUE
    })
  }

  const setSelectedSite = (value: string) => {
    if (!value || value === ALL_SITES_VALUE) {
      setSelectedSiteState(ALL_SITES_VALUE)
      return
    }

    const site = mockSites.find((item) => item.siteId === value)
    if (!site) {
      setSelectedSiteState(ALL_SITES_VALUE)
      return
    }

    if (!canSelectAnyClient && selectedClient !== site.cliente) {
      return
    }

    if (canSelectAnyClient) {
      setSelectedClientState(site.cliente)
    }

    setSelectedSiteState(site.siteId)
  }

  return (
    <ScopeContext.Provider
      value={{
        selectedClient,
        selectedSite,
        availableClients: canSelectAnyClient
          ? [{ id: ALL_CLIENTS_VALUE, label: 'Todos os clientes' }, ...allowedClients]
          : allowedClients,
        availableSites: [{ id: ALL_SITES_VALUE, label: 'Todos os sites' }, ...availableSites],
        canSelectAnyClient,
        setSelectedClient,
        setSelectedSite,
      }}
    >
      {children}
    </ScopeContext.Provider>
  )
}

export function useScope() {
  const context = useContext(ScopeContext)

  if (context === undefined) {
    throw new Error('useScope must be used within a ScopeProvider')
  }

  return context
}
