import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'redprice_stats'
const MAX_EVENTS = 5000

const defaultSettings = {
  platform: { minOrderSum: 0, currency: '₸', siteName: 'Redprice.kz' },
  wholesale: { minOrderSum: 0, currency: '₸' },
  procurement: { currency: '₸' }
}

const SETTINGS_KEY = 'redprice_section_settings'

function loadStats() {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) return JSON.parse(s)
  } catch (_) {}
  return { visits: [], searches: [], conversions: [] }
}

function saveStats(data) {
  try {
    const trimmed = {
      visits: (data.visits || []).slice(-MAX_EVENTS),
      searches: (data.searches || []).slice(-MAX_EVENTS),
      conversions: (data.conversions || []).slice(-MAX_EVENTS)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (_) {}
}

function loadSettings() {
  try {
    const s = localStorage.getItem(SETTINGS_KEY)
    if (s) return JSON.parse(s)
  } catch (_) {}
  return defaultSettings
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (_) {}
}

const StatsContext = createContext(null)

export function StatsProvider({ children }) {
  const [stats, setStatsState] = useState(loadStats)
  const [settings, setSettingsState] = useState(loadSettings)

  useEffect(() => {
    saveStats(stats)
  }, [stats])

  const trackVisit = useCallback((path) => {
    setStatsState((prev) => ({
      ...prev,
      visits: [...(prev.visits || []), { path, at: new Date().toISOString() }]
    }))
  }, [])

  const trackSearch = useCallback((query, path) => {
    if (!query || !String(query).trim()) return
    setStatsState((prev) => ({
      ...prev,
      searches: [...(prev.searches || []), { q: String(query).trim(), path: path || '/', at: new Date().toISOString() }]
    }))
  }, [])

  const trackConversion = useCallback((payload) => {
    setStatsState((prev) => ({
      ...prev,
      conversions: [...(prev.conversions || []), { ...payload, at: new Date().toISOString() }]
    }))
  }, [])

  const setSettings = useCallback((section, value) => {
    setSettingsState((prev) => {
      const next = { ...prev, [section]: { ...(prev[section] || {}), ...value } }
      saveSettings(next)
      return next
    })
  }, [])

  const getSettings = useCallback((section) => {
    return { ...defaultSettings[section], ...settings[section] } || {}
  }, [settings])

  return (
    <StatsContext.Provider
      value={{
        stats,
        trackVisit,
        trackSearch,
        trackConversion,
        settings,
        setSettings,
        getSettings
      }}
    >
      {children}
    </StatsContext.Provider>
  )
}

export function useStats() {
  const ctx = useContext(StatsContext)
  if (!ctx) return {
    stats: { visits: [], searches: [], conversions: [] },
    trackVisit: () => {},
    trackSearch: () => {},
    trackConversion: () => {},
    settings: defaultSettings,
    setSettings: () => {},
    getSettings: (s) => defaultSettings[s] || {}
  }
  return ctx
}
