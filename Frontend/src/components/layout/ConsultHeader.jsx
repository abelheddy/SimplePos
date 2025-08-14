import React from 'react';
import { Link } from 'react-router-dom';

const AdminHeader = () => {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">Panel de Administración</h1>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <span className="text-gray-600">🔔</span>
          </button>
          <div className="relative">
            <button className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                A
              </div>
              <span className="text-gray-700">Consultor</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
              <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Perfil</Link>
              <Link to="/logout" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Cerrar sesión</Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;