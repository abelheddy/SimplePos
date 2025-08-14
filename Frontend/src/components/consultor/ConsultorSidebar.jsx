import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const ConsultorSidebar = () => {
  const [expanded] = useState(true);

  const menuItems = [
    { title: 'Dashboard', icon: '📊', path: '/consultor' },
    { title: 'Reportes', icon: '📈', path: '/consultor/reports' }//,
    //{ title: 'Estadísticas', icon: '🧮', path: '/consultor/estadisticas' }
  ];

  return (
    <div className="bg-purple-800 text-white h-full w-64 flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-bold">Panel de Consultor</h2>
      </div>
      <nav className="mt-6">
        <ul className="space-y-2 px-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg hover:bg-purple-700 ${isActive ? 'bg-purple-600' : ''}`
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

export default ConsultorSidebar;