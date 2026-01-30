import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProductsProvider } from './context/ProductsContext'
import { CategoriesProvider } from './context/CategoriesContext'
import { SuppliersProvider } from './context/SuppliersContext'
import { OrdersProvider } from './context/OrdersContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { StatsProvider } from './context/StatsContext'
import Catalog from './pages/Catalog'
import CatalogWholesale from './pages/CatalogWholesale'
import CatalogProcurement from './pages/CatalogProcurement'
import Admin from './pages/Admin'
import AdminSetPassword from './pages/AdminSetPassword'
import './App.css'

function App() {
  return (
    <AdminAuthProvider>
    <StatsProvider>
    <SuppliersProvider>
    <CategoriesProvider>
    <OrdersProvider>
    <ProductsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/opt" element={<CatalogWholesale />} />
          <Route path="/zakup" element={<CatalogProcurement />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/set-password" element={<AdminSetPassword />} />
        </Routes>
      </BrowserRouter>
    </ProductsProvider>
    </OrdersProvider>
    </CategoriesProvider>
    </SuppliersProvider>
    </StatsProvider>
    </AdminAuthProvider>
  )
}

export default App
