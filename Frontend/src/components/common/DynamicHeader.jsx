// src/components/common/DynamicHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente DynamicHeader - Encabezado universal que se adapta al rol del usuario
 * 
 * Características:
 * - Muestra el rol real del usuario (admin, vendedor, consultor)
 * - Botón para regresar al menú de selección de paneles
 * - Se adapta visualmente al rol del usuario
 * - Funcional para todos los paneles
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.panelTitle - Título del panel actual
 * @returns {JSX.Element} Elemento JSX del encabezado dinámico
 */
const DynamicHeader = ({ panelTitle }) => {
  const { isAuthenticated, userData, logout, role } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  /**
   * Efecto para cerrar el menú cuando se hace clic fuera de él
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Maneja el cierre de sesión del usuario
   */
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Configuración visual basada en el rol
  const getRoleConfig = () => {
    switch(role) {
      case 'admin':
        return {
          roleLabel: 'Administrador',
          avatarBg: 'from-blue-500 to-purple-600',
          dotColor: 'bg-blue-500',
          panelTitle: panelTitle || 'Panel de Administración'
        };
      case 'vendedor':
        return {
          roleLabel: 'Vendedor',
          avatarBg: 'from-green-500 to-teal-600',
          dotColor: 'bg-green-500',
          panelTitle: panelTitle || 'Panel de Vendedor'
        };
      case 'consultor':
        return {
          roleLabel: 'Consultor',
          avatarBg: 'from-yellow-500 to-orange-500',
          dotColor: 'bg-yellow-500',
          panelTitle: panelTitle || 'Panel de Consultor'
        };
      default:
        return {
          roleLabel: 'Usuario',
          avatarBg: 'from-gray-500 to-gray-700',
          dotColor: 'bg-gray-500',
          panelTitle: panelTitle || 'Panel del Sistema'
        };
    }
  };

  const roleConfig = getRoleConfig();

  return (
    <header className="bg-white shadow-sm z-10 sticky top-0">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Panel izquierdo: Botones de navegación */}
        <div className="flex items-center space-x-4">
          {/* Botón para regresar al menú de paneles */}
          <Link 
            to="/dashboard-selector" 
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Menú de Paneles
          </Link>
          
          {/* Título del panel */}
          <h1 className="text-xl font-semibold text-gray-800 hidden md:block">
            {roleConfig.panelTitle}
          </h1>
        </div>
        
        {/* Panel derecho: Acciones de usuario */}
        <div className="flex items-center space-x-4">
          <button 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Notificaciones"
          >
            <span className="text-gray-600">🔔</span>
          </button>

          {/* Menú de usuario */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 focus:outline-none group"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              {/* Avatar del usuario */}
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${roleConfig.avatarBg} flex items-center justify-center text-white shadow-md`}>
                {userData?.email?.charAt(0).toUpperCase() || roleConfig.roleLabel.charAt(0)}
              </div>
              
              {/* Información del usuario */}
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                  {userData?.name || roleConfig.roleLabel}
                </p>
                <p className="text-xs text-gray-500 flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${roleConfig.dotColor} mr-1`}></span>
                  {roleConfig.roleLabel}
                </p>
              </div>
            </button>

            {/* Menú desplegable */}
            {isMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100 divide-y divide-gray-100"
                role="menu"
              >
                {/* Sección de información del usuario */}
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userData?.name || roleConfig.roleLabel}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {userData?.email || `${role}@system.com`}
                  </p>
                </div>
                
                {/* Sección de acciones */}
                <div className="py-1">
                  <Link 
                    to="/perfil" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                    role="menuitem"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Perfil
                  </Link>
                  
                  <Link 
                    to="/settings" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                    role="menuitem"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Configuración
                  </Link>
                </div>
                
                {/* Sección de cierre de sesión */}
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    role="menuitem"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DynamicHeader;