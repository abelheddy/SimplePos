// src/components/DynamicSidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DynamicSidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const { role } = useAuth();

  // Definir menús para cada rol
  const roleMenus = {
    admin: [
      { title: 'Dashboard', icon: '📊', path: '/admin' },
      {
        title: 'Gestión de Usuarios',
        icon: '👥',
        subItems: [
          { title: 'Lista de usuarios', path: '/admin/users' },
          { title: 'Crear usuario', path: '/admin/users/create' },
          { title: 'Gestión de roles', path: '/admin/users/roles' }
        ]
      },
      {
        title: 'Gestión de Productos',
        icon: '📦',
        subItems: [
          { title: 'Inventario', path: '/admin/products' },
          { title: 'Tipos de IVA', path: '/admin/taxes' },
          { title: 'Gestión de Marcas', path: '/admin/products/brands' },
          { title: 'Crear Producto', path: '/admin/products/create' }
        ]
      }
    ],
    consultor: [
      { title: 'Dashboard', icon: '📊', path: '/consultor' },
      { title: 'Reportes', icon: '📈', path: '/consultor/reports' }
    ],
    vendedor: [
      { title: 'Dashboard', icon: '📊', path: '/vendedor' },
      { title: 'Ventas', icon: '💰', path: '/vendedor/sales' },
      { title: 'Nueva Venta', icon: '🛒', path: '/vendedor/sales/new' }
    ]
  };

  // Obtener menú según el rol
  const menuItems = roleMenus[role] || [];

  // Colores según rol
  const roleColors = {
    admin: {
      bg: 'bg-blue-800',
      hover: 'hover:bg-blue-700',
      active: 'bg-blue-600'
    },
    consultor: {
      bg: 'bg-purple-800',
      hover: 'hover:bg-purple-700',
      active: 'bg-purple-600'
    },
    vendedor: {
      bg: 'bg-green-800',
      hover: 'hover:bg-green-700',
      active: 'bg-green-600'
    }
  };

  const colors = roleColors[role] || roleColors.admin;

  // Títulos según rol
  const roleTitles = {
    admin: 'Admin Panel',
    consultor: 'Panel de Consultor',
    vendedor: 'Panel de Vendedor'
  };

  return (
    <div className={`${colors.bg} text-white h-full ${expanded ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col`}>
      <div className="p-4 flex justify-between items-center">
        {expanded && <h2 className="text-xl font-bold">{roleTitles[role]}</h2>}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-opacity-50 hover:bg-white"
        >
          {expanded ? '◀' : '▶'}
        </button>
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.path ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg ${colors.hover} ${
                      isActive ? colors.active : ''
                    }`
                  }
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {expanded && <span>{item.title}</span>}
                </NavLink>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center p-3 rounded-lg ${colors.hover} cursor-pointer">
                    <span className="text-xl mr-3">{item.icon}</span>
                    {expanded && <span className="flex-1">{item.title}</span>}
                  </div>
                  {expanded && item.subItems && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <NavLink
                            to={subItem.path}
                            className={({ isActive }) =>
                              `block p-2 rounded-lg ${colors.hover} ${
                                isActive ? colors.active : ''
                              }`
                            }
                          >
                            {subItem.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default DynamicSidebar;