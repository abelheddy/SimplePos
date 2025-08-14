// src/components/DashboardSelector.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardSelector = () => {
  const { role } = useAuth();
  
  switch(role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'vendedor':
      return <Navigate to="/vendedor" replace />;
    case 'consultor':
      return <Navigate to="/consultor" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default DashboardSelector;