import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProductsProvider } from './context/ProductsContext'
import { CategoriesProvider } from './context/CategoriesContext'
import { SuppliersProvider } from './context/SuppliersContext'
import { OrdersProvider } from './context/OrdersContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { StatsProvider } from './context/StatsContext'
import { SessionProvider } from './context/SessionContext'
import Admin from './pages/Admin'
import AdminSetPassword from './pages/AdminSetPassword'
import AdminCennik from './pages/AdminCennik'
import AdminRedisEsl from './pages/AdminRedisEsl'
import InvestorPage from './app/(redprice)/InvestorPage'
import SupplierPage from './app/(supplier)/SupplierPage'
import SupplierLoginPage from './app/(supplier)/SupplierLoginPage'
import PartnersPage from './pages/PartnersPage'
import PartnerLoginPage from './pages/PartnerLoginPage'
import ContactsPage from './pages/ContactsPage'
import AdminContactsPage from './pages/AdminContactsPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import NewsFeed from './pages/NewsFeed'
import NewsArticle from './pages/NewsArticle'
import './tailwind.css'
import './App.css'

function App() {
  return (
    <AdminAuthProvider>
    <StatsProvider>
    <SuppliersProvider>
    <CategoriesProvider>
    <OrdersProvider>
    <ProductsProvider>
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/opt" element={<Navigate to="/" replace />} />
          <Route path="/zakup" element={<Navigate to="/" replace />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/contacts" element={<AdminContactsPage />} />
          <Route path="/admin/set-password" element={<AdminSetPassword />} />
          <Route path="/admin/cennik" element={<AdminCennik />} />
          <Route path="/admin/redis-esl" element={<AdminRedisEsl />} />
          <Route path="/investor" element={<InvestorPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/partner-login" element={<PartnerLoginPage />} />
          <Route path="/supplier/login" element={<SupplierLoginPage />} />
          <Route
            path="/supplier"
            element={
              <ProtectedRoute roles={['SUPPLIER']}>
                <SupplierPage />
              </ProtectedRoute>
            }
          />
          <Route path="/news" element={<NewsFeed />} />
          <Route path="/news/:slug" element={<NewsArticle />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/admin-panel" element={<Navigate to="/admin?panel=api" replace />} />
          <Route path="/admin/news-editor" element={<Navigate to="/admin?panel=news" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
    </ProductsProvider>
    </OrdersProvider>
    </CategoriesProvider>
    </SuppliersProvider>
    </StatsProvider>
    </AdminAuthProvider>
  )
}

export default App
