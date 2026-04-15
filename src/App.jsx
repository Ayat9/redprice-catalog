import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProductsProvider } from './context/ProductsContext'
import { CategoriesProvider } from './context/CategoriesContext'
import { SuppliersProvider } from './context/SuppliersContext'
import { OrdersProvider } from './context/OrdersContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { StatsProvider } from './context/StatsContext'
import Admin from './pages/Admin'
import AdminSetPassword from './pages/AdminSetPassword'
import AdminCennik from './pages/AdminCennik'
import AdminRedisEsl from './pages/AdminRedisEsl'
import InvestorPage from './app/(redprice)/InvestorPage'
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NewsFeed />} />
          <Route path="/opt" element={<Navigate to="/" replace />} />
          <Route path="/zakup" element={<Navigate to="/" replace />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/set-password" element={<AdminSetPassword />} />
          <Route path="/admin/cennik" element={<AdminCennik />} />
          <Route path="/admin/redis-esl" element={<AdminRedisEsl />} />
          <Route path="/investor" element={<InvestorPage />} />
          <Route path="/news" element={<NewsFeed />} />
          <Route path="/news/:slug" element={<NewsArticle />} />
          <Route path="/admin-panel" element={<Navigate to="/admin?panel=api" replace />} />
          <Route path="/admin/news-editor" element={<Navigate to="/admin?panel=news" replace />} />
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
