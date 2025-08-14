// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import AdminLayout from './components/admin/AdminLayout';
import VendedorLayout from './components/vendedor/VendedorLayout'; // Importación añadida
import ConsultorLayout from './components/consultor/ConsultorLayout'; // Importación añadida

// Páginas Públicas
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';

// Páginas de Administrador
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserListPage from './pages/admin/users/UserListPage';
import UserCreatePage from './pages/admin/users/UserCreatePage';
import UserEditPage from './pages/admin/users/UserEditPage';

// Nuevas páginas para vendedor y consultor
import VendedorDashboardPage from './pages/vendedor/VendedorDashboardPage'; // Importación añadida
import ConsultorDashboardPage from './pages/consultor/ConsultorDashboardPage'; // Importación añadida

// Componente protegido
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

import DashboardSelector from './components/DashboardSelector'; // Importación añadida

// Rutas de Productos
import ProductListPage from './pages/admin/products/ProductListPage';
import ProductCreatePage from './pages/admin/products/ProductCreatePage';
import BrandsPage from './pages/admin/products/BrandsPage'; // Importación añadida
import ProductEditPage from './pages/admin/products/ProductEditPage'; // Importación añadida
import Taxes from './pages/admin/products/TaxesPage'; // Importación añadida

// Rutas de vendedor
import SalesPage from './pages/vendedor/sell/SalesPage'; // Importación añadida
import NewSalePage from './pages/vendedor/sell/NewSalePage';




function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard-selector" element={
        <ProtectedRoute>
          <DashboardSelector />
        </ProtectedRoute>
      } />
      {/* Rutas protegidas */}
      <Route path="/admin" element={
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
      </Route>

      {/* Nuevas rutas para vendedor */}
      <Route path="/vendedor" element={
        <ProtectedRoute requiredRole="vendedor">
          <VendedorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<VendedorDashboardPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/new" element={<NewSalePage />} />
      </Route>

      {/* Nuevas rutas para consultor */}
      <Route path="/consultor" element={
        <ProtectedRoute requiredRole="consultor">
          <ConsultorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ConsultorDashboardPage />} />
      </Route>

      <Route path="*" element={<div>Página no encontrada</div>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;