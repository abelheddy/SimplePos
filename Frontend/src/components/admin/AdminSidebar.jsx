import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = () => {
  const [expanded, setExpanded] = useState(true);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      path: '/admin'
    },
    {
      title: 'Gestión de Usuarios',
      icon: '👥',
      subItems: [
        { title: 'Lista de usuarios', path: '/admin/users' },
        { title: 'Crear usuario', path: '/admin/users/create' }
        //{ title: 'Asignar roles', path: '/admin/users/roles' }
      ]
    },
// Cambiar el texto de "Marcas" a "Gestión de Marcas"
{
  title: 'Gestión de Productos',
  icon: '📦',
  subItems: [
    { title: 'Inventario', path: '/admin/products' },
    { title: 'Tipos de IVA', path: '/admin/taxes' },
    { title: 'Gestión de Marcas', path: '/admin/products/brands' }, // Actualizado
    { title: 'Crear Producto', path: '/admin/products/create' }
  ]
}
  ];

  return (
    <div className={`bg-blue-800 text-white h-full ${expanded ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col`}>
      <div className="p-4 flex justify-between items-center">
        {expanded && <h2 className="text-xl font-bold">Admin Panel</h2>}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-blue-700"
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
                    `flex items-center p-3 rounded-lg hover:bg-blue-700 ${isActive ? 'bg-blue-600' : ''}`
                  }
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {expanded && <span>{item.title}</span>}
                </NavLink>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center p-3 rounded-lg hover:bg-blue-700 cursor-pointer">
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
                              `block p-2 rounded-lg hover:bg-blue-700 ${isActive ? 'bg-blue-600' : ''}`
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

export default AdminSidebar;