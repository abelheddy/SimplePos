// src/components/DashboardSelector.jsx
import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente para seleccionar dashboard según el rol de usuario
 * - Para administradores: muestra opciones para acceder a todos los paneles
 * - Para otros roles: redirige automáticamente a su panel correspondiente
 * 
 * @returns {React.ReactNode} - Elemento JSX a renderizar
 */
const DashboardSelector = () => {
  const { role } = useAuth();
  
  // Menú de selección exclusivo para administradores
  if (role === 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-3xl font-bold mb-8">Seleccione un Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Opción: Panel de Administrador */}
          <Link 
            to="/admin" 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition duration-300 text-center"
          >
            Panel Administrador
          </Link>
          
          {/* Opción: Panel de Vendedor */}
          <Link 
            to="/vendedor" 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition duration-300 text-center"
          >
            Panel Vendedor
          </Link>
          
          {/* Opción: Panel de Consultor */}
          <Link 
            to="/consultor" 
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition duration-300 text-center"
          >
            Panel Consultor
          </Link>
        </div>
      </div>
    );
  }
  
  // Redirección automática para roles no administrativos
  switch(role) {
    case 'vendedor':
      return <Navigate to="/vendedor" replace />;
    case 'consultor':
      return <Navigate to="/consultor" replace />;
    default:
      // Redirigir a login si no hay rol válido
      return <Navigate to="/login" replace />;
  }
};

export default DashboardSelector;