import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const VendedorSidebar = () => {
  const [expanded] = useState(true); // Podrías hacerlo colapsable si quieres

  const menuItems = [
    { title: 'Dashboard', icon: '📊', path: '/vendedor/dashboard' },
    { title: 'Ventas', icon: '💰', path: '/vendedor/ventas' }
  ];

  return (
    <div className="bg-green-800 text-white h-full w-64 flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-bold">Panel de Vendedor</h2>
      </div>
      <nav className="mt-6">
        <ul className="space-y-2 px-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg hover:bg-green-700 ${isActive ? 'bg-green-600' : ''}`
                }
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default VendedorSidebar;