import React from 'react';

const ProfileInfo = ({ user, onEdit }) => {
  const { name = 'No disponible', email = 'No disponible', role = 'No disponible' } = user || {};

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center mb-8">
        <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mb-4 md:mb-0 md:mr-6">
          <span className="text-3xl text-gray-600">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-800 text-center md:text-left">{name}</h1>
          <p className="text-gray-600 text-center md:text-left">{email}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Rol</h3>
          <p className="text-lg font-medium text-gray-800">{role}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
          <p className="text-lg font-medium text-green-600">Activo</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onEdit}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Editar Perfil
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
};

export default ProfileInfo;