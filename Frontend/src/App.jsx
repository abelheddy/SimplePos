// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import AdminLayout from './components/admin/AdminLayout';
import VendedorLayout from './components/vendedor/VendedorLayout';
import ConsultorLayout from './components/consultor/ConsultorLayout';

// Páginas Públicas
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';

// Páginas de Administrador
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserListPage from './pages/admin/users/UserListPage';
import UserCreatePage from './pages/admin/users/UserCreatePage';
import UserEditPage from './pages/admin/users/UserEditPage';

// Páginas para otros roles
import VendedorDashboardPage from './pages/vendedor/VendedorDashboardPage';
import ConsultorDashboardPage from './pages/consultor/ConsultorDashboardPage';

// Componentes de protección y autenticación
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import DashboardSelector from './components/DashboardSelector';

// Rutas de Productos
import ProductListPage from './pages/admin/products/ProductListPage';
import ProductCreatePage from './pages/admin/products/ProductCreatePage';
import BrandsPage from './pages/admin/products/BrandsPage';
import ProductEditPage from './pages/admin/products/ProductEditPage';
import Taxes from './pages/admin/products/TaxesPage';

// Rutas de Vendedor
import SalesPage from './pages/vendedor/sell/SalesPage';
import NewSalePage from './pages/vendedor/sell/NewSalePage';

// Rutas de Consultor
import ReportsPage from './pages/consultor/Report/ReportsPage';

// Manejo de sesión
import LogoutPage from './components/auth/LogoutPage';

// Ruta de perfil
import ProfilePage from './pages/ProfilePage';

/**
 * Componente principal de rutas de la aplicación
 * 
 * @returns {React.ReactNode} - Elemento JSX con la configuración de rutas
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/perfil" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      {/* Selector de dashboard (protegido) */}
      <Route path="/dashboard-selector" element={
        <ProtectedRoute>
          <DashboardSelector />
        </ProtectedRoute>
      } />

      {/* ================= RUTAS DE ADMINISTRADOR ================= */}
      <Route path="/admin" element={
        // Acceso exclusivo para administradores
        <ProtectedRoute requiredRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<UserListPage />} />
        <Route path="users/create" element={<UserCreatePage />} />
        <Route path="users/edit/:id" element={<UserEditPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/create" element={<ProductCreatePage />} />
        <Route path="products/brands" element={<BrandsPage />} />
        <Route path="products/edit/:id" element={<ProductEditPage />} />
        <Route path="taxes" element={<Taxes />} />

        {/* El administrador también puede acceder a funcionalidades de vendedor */}
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/new" element={<NewSalePage />} />
      </Route>

      {/* ================= RUTAS DE VENDEDOR ================= */}
      <Route path="/vendedor" element={
        /**
         * Acceso para:
         * 1. Vendedores (rol 'vendedor')
         * 2. Administradores (rol 'admin')
         */
        <ProtectedRoute>
          <VendedorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<VendedorDashboardPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/new" element={<NewSalePage />} />
      </Route>

      {/* ================= RUTAS DE CONSULTOR ================= */}
      <Route path="/consultor" element={
        /**
         * Acceso para:
         * 1. Consultores (rol 'consultor')
         * 2. Administradores (rol 'admin')
         */
        <ProtectedRoute>
          <ConsultorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ConsultorDashboardPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Ruta para manejar páginas no encontradas */}
      <Route path="*" element={<div className="p-8 text-center">Página no encontrada</div>} />
    </Routes>
  );
}

/**
 * Componente raíz de la aplicación
 * 
 * @returns {React.ReactNode} - Elemento JSX principal
 */
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;