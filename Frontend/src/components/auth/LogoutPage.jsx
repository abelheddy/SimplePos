// src/pages/Auth/LogoutPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Ejecutar el logout inmediatamente al cargar la página
    logout();
    
    // Redirigir después de 1 segundo
    const timer = setTimeout(() => {
      navigate('/login');
    }, 1000);

    return () => clearTimeout(timer);
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
        <p className="text-lg text-gray-700">Cerrando sesión...</p>
      </div>
    </div>
  );
};

export default LogoutPage;