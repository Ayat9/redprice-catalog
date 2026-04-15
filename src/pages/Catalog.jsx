import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/Header'
import { useStats } from '../context/StatsContext'
import { useSeo } from '../hooks/useSeo'

const CATALOG_TITLE = 'Redprice.kz'
const CATALOG_DESCRIPTION = 'Redprice.kz — Казахстан.'

export default function Catalog() {
  useSeo({ title: CATALOG_TITLE, description: CATALOG_DESCRIPTION })

  const location = useLocation()
  const { trackVisit } = useStats()

  useEffect(() => {
    trackVisit(location.pathname || '/')
  }, [location.pathname, trackVisit])

  return (
    <div className="app platform-app platform-home">
      <Header showCart={false} />
      <div className="platform-main">
        <main className="platform-content catalog-home-main" id="catalog" role="main">
          <h1 className="visually-hidden">{CATALOG_TITLE}</h1>
        </main>
      </div>
    </div>
  )
}
