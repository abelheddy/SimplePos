import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import ProfileInfo from '../components/profile/ProfileInfo';
import ProfileForm from '../components/profile/ProfileForm';
import { useNavigate } from 'react-router-dom';
import DynamicHeader from '../components/common/DynamicHeader';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token no encontrado');
        }
        
        const response = await userAPI.getProfile(token);
        
        setProfileData({
          id: authUser?.id || 'N/A',
          name: response.data.name || authUser?.email || 'Usuario',
          email: response.data.email || authUser?.email || 'Email no disponible',
          role: response.data.role || authUser?.role || 'Rol no disponible'
        });
      } catch (err) {
        console.error('Error cargando perfil:', err);
        setError(err.message || 'Error al cargar el perfil');
        
        if (authUser) {
          setProfileData({
            id: authUser.id,
            name: authUser.email,
            email: authUser.email,
            role: authUser.role
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [authUser, isAuthenticated, navigate]);

  const handleSave = async (updatedData) => {
    try {
      setError('');
      setSuccessMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado');
      }
      
      await userAPI.updateProfile(updatedData, token);
      
      setProfileData(prev => ({
        ...prev,
        name: updatedData.name,
        email: updatedData.email
      }));
      
      setSuccessMessage('¡Perfil actualizado correctamente!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError(err.response?.data?.message || 'Error al actualizar el perfil');
    }
  };

  const handleBack = () => {
    // Regresar a la página anterior o al dashboard-selector
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard-selector');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <DynamicHeader panelTitle="Perfil de Usuario" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-gray-600">Cargando perfil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicHeader panelTitle="Perfil de Usuario" />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-6">
            <button 
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Volver
            </button>
          </div>
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg text-center">
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">
              {error}
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {isEditing ? (
              <ProfileForm 
                user={profileData} 
                onSave={handleSave} 
                onCancel={() => setIsEditing(false)} 
              />
            ) : profileData ? (
              <ProfileInfo 
                user={profileData} 
                onEdit={() => setIsEditing(true)} 
              />
            ) : (
              <div className="p-8 text-center">
                <p className="text-lg text-gray-700 mb-6">No se encontraron datos del perfil</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Recargar datos
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Crear perfil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;