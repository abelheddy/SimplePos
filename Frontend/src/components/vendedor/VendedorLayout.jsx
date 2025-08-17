// src/components/vendedor/VendedorLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import VendedorSidebar from './VendedorSidebar';
import DynamicHeader from '../common/DynamicHeader';

const VendedorLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100 flex-col">
      <DynamicHeader panelTitle="Panel de Vendedor" />
      <div className="flex flex-1 overflow-hidden">
        <VendedorSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendedorLayout;