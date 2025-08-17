// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente de ruta protegida que verifica autenticación y roles de usuario
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Elementos hijos a renderizar si se cumple la autenticación
 * @param {string} [props.requiredRole] - Rol requerido para acceder a la ruta
 * @returns {React.ReactNode} - Elemento JSX a renderizar
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, loading } = useAuth();

  // Mostrar spinner de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /**
   * Lógica de verificación de acceso:
   * 1. Los administradores tienen acceso total a todas las rutas
   * 2. Si no hay rol requerido, cualquier usuario autenticado puede acceder
   * 3. Si hay rol requerido, solo usuarios con ese rol o administradores pueden acceder
   */
  const isAdmin = role === 'admin';
  const hasRequiredRole = !requiredRole || role === requiredRole;
  
  // Redirigir al selector de dashboard si no tiene permiso
  if (!isAdmin && !hasRequiredRole) {
    return <Navigate to="/dashboard-selector" replace />;
  }

  // Renderizar contenido protegido si pasa todas las verificaciones
  return children;
};

export default ProtectedRoute;