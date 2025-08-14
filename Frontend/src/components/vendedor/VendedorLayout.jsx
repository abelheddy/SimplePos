import React from 'react';
import { Outlet } from 'react-router-dom';
import VendedorSidebar from './VendedorSidebar';
import Header from '../layout/SellerHeader';

const VendedorLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100 flex-col">
      <Header />
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