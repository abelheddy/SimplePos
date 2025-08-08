// src/components/DashboardSelector.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardSelector = () => {
  const { role } = useAuth();
  
  switch(role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'vendedor':
      return <Navigate to="/vendedor/dashboard" replace />;
    case 'consultor':
      return <Navigate to="/consultor/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default DashboardSelector;