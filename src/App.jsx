import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SuppliersProvider } from './context/SuppliersContext'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Home from './pages/Home'
import SupplierDetail from './pages/SupplierDetail'
import Admin from './pages/Admin'
import AdminSettings from './pages/AdminSettings'
import AdminCustomers from './pages/AdminCustomers'
import AdminCategories from './pages/AdminCategories'
import AdminAnalytics from './pages/AdminAnalytics'
import SupplierProducts from './pages/SupplierProducts'
import Cart from './pages/Cart'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Calculator from './pages/Calculator'
import ProtectedRoute from './components/ProtectedRoute'
import { CustomersProvider } from './context/CustomersContext'
import { CategoriesProvider } from './context/CategoriesContext'
import { OrdersProvider } from './context/OrdersContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <SuppliersProvider>
        <CustomersProvider>
          <CategoriesProvider>
            <OrdersProvider>
              <CartProvider>
            <Router>
              <Routes>
                <Route path="/" element={
                  <div className="app">
                    <Header />
                    <main className="main-content">
                      <Home />
                    </main>
                  </div>
                } />
                <Route path="/supplier/:id" element={
                  <div className="app">
                    <Header />
                    <main className="main-content">
                      <SupplierDetail />
                    </main>
                  </div>
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/customers" 
                  element={
                    <ProtectedRoute>
                      <AdminCustomers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/categories" 
                  element={
                    <ProtectedRoute>
                      <AdminCategories />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/analytics" 
                  element={
                    <ProtectedRoute>
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <ProtectedRoute>
                      <AdminSettings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/supplier/:id/products" 
                  element={
                    <ProtectedRoute>
                      <SupplierProducts />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/cart" element={
                  <div className="app">
                    <Header />
                    <main className="main-content">
                      <Cart />
                    </main>
                  </div>
                } />
                <Route path="/calculator" element={
                  <div className="app">
                    <Header />
                    <main className="main-content">
                      <Calculator />
                    </main>
                  </div>
                } />
              </Routes>
            </Router>
          </CartProvider>
            </OrdersProvider>
          </CategoriesProvider>
        </CustomersProvider>
      </SuppliersProvider>
    </AuthProvider>
  )
}

export default App
