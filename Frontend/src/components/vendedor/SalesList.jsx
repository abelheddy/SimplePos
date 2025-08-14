import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesAPI } from '../../services/api';
import SaleItem from './SaleItem';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Cargar ventas con manejo de errores mejorado
  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await salesAPI.getAll();
      
      if (!response.data) {
        throw new Error('No se recibieron datos de ventas');
      }

      // Normalizar datos de ventas
      const normalizedSales = response.data.map(sale => ({
        ...sale,
        _id: sale._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: sale.timestamp || Math.floor(Date.now() / 1000),
        amount: sale.totalAmount || sale.amount || 0,
        product: sale.items?.[0]?.productName || 'Venta múltiple',
        quantity: sale.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0,
        productId: sale.items?.[0]?.productId || 'N/A'
      }));

      setSales(normalizedSales);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta venta?')) {
      try {
        await salesAPI.delete(id);
        setSales(prev => prev.filter(sale => sale._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar la venta');
      }
    }
  };

  // Filtrar ventas basado en múltiples criterios
  const filteredSales = sales.filter(sale => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      (sale._id && sale._id.toLowerCase().includes(term)) ||
      (sale.product && sale.product.toLowerCase().includes(term)) ||
      (sale.productId && sale.productId.toLowerCase().includes(term)) ||
      (sale.timestamp && format(new Date(sale.timestamp * 1000), 'PPP', { locale: es }).toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
              <button 
                onClick={fetchSales} 
                className="ml-2 text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
              >
                Reintentar
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historial de Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredSales.length} {filteredSales.length === 1 ? 'venta' : 'ventas'} registradas
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Buscar ventas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <button
            onClick={() => navigate('/vendedor/sales/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nueva Venta
          </button>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {searchTerm ? 'No se encontraron ventas' : 'No hay ventas registradas'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando una nueva venta'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/vendedor/sales/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <SaleItem
                key={`sale-${sale._id}`}
                sale={sale}
                onDelete={handleDelete}
                onEdit={() => navigate(`/vendedor/sales/edit/${sale._id}`)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SalesList;