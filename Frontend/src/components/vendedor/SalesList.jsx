import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { salesAPI } from '../../services/api';
import SaleItem from './SaleItem';
import { 
  FiPlus, 
  FiSearch, 
  FiX, 
  FiRefreshCw, 
  FiBarChart2,
  FiShoppingBag
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Cargar ventas con manejo de errores mejorado
  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await salesAPI.getAll();
      
      console.log('API Response:', response); 
      console.log('Response data:', response.data);
      
      // Manejo flexible de la estructura de respuesta
      let salesData = [];
      if (Array.isArray(response.data)) {
        salesData = response.data;
      } else if (response.data && Array.isArray(response.data.sales)) {
        salesData = response.data.sales;
      } else {
        console.warn('Formato inesperado de respuesta:', response.data);
        salesData = [];
      }
      
      console.log('Sales data (raw):', salesData);
      
      // Filtrar ventas con ID válido (acepta _id o id)
      const validSales = salesData.filter(sale => sale && (sale._id || sale.id));
      
      console.log('Valid sales:', validSales);
      
      // Normalizar datos para ventas válidas
      const normalizedSales = validSales.map(sale => {
        // Asegurar que tenemos _id (si viene como id, lo copiamos a _id)
        const saleId = sale._id || sale.id;
        
        // Calcular cantidad total de productos
        const totalQuantity = sale.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
        
        // Determinar el nombre del producto principal
        let mainProduct = 'Venta múltiple';
        if (sale.items && sale.items.length > 0) {
          mainProduct = sale.items[0].productName || sale.items[0].name || mainProduct;
        }
        
        return {
          ...sale,
          _id: saleId, // Garantizamos que _id exista
          id: undefined, // Eliminamos el campo id duplicado si existe
          timestamp: sale.timestamp || Math.floor(Date.now() / 1000),
          amount: sale.totalAmount || sale.amount || 0,
          product: mainProduct,
          quantity: totalQuantity,
          productId: sale.items?.[0]?.productId || sale.items?.[0]?.id || 'N/A'
        };
      });

      console.log('Normalized sales:', normalizedSales);
      
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

  // Efecto de diagnóstico: si no hay ventas y ya se cargaron, mostrar estructura
  useEffect(() => {
    if (!loading && sales.length === 0) {
      console.log("Diagnóstico: No se cargaron ventas. Revisa la estructura de la respuesta.");
    }
  }, [loading, sales]);

  const handleDelete = async (id) => {
    if (!id) {
      console.error("Intento de eliminar venta sin ID");
      setError("No se puede eliminar esta venta porque no tiene un ID válido");
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar esta venta?')) {
      setDeletingId(id);
      
      try {
        await salesAPI.delete(id);
        setSales(prev => prev.filter(sale => sale._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar la venta');
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Filtrar ventas basado en múltiples criterios
  const filteredSales = sales.filter(sale => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      (sale._id && sale._id.toLowerCase().includes(term)) ||
      (sale.id && sale.id.toLowerCase().includes(term)) || // Búsqueda por id alternativo
      (sale.product && sale.product.toLowerCase().includes(term)) ||
      (sale.productId && sale.productId.toLowerCase().includes(term)) ||
      (sale.timestamp && new Date(sale.timestamp * 1000).toLocaleDateString('es-ES').toLowerCase().includes(term))
    );
  });

  const totalSalesValue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
  const completedSales = sales.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FiBarChart2 className="mr-3 text-blue-500" />
              Historial de Ventas
            </h1>
            <p className="text-gray-600 mt-1">
              {completedSales} ventas completadas • ${totalSalesValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSales}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              disabled={loading}
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </button>
            <button
              onClick={() => navigate('/vendedor/sales/new')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg flex items-center"
            >
              <FiPlus className="mr-2" /> Nueva Venta
            </button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar ventas por producto, fecha o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
              {filteredSales.length} {filteredSales.length === 1 ? 'resultado' : 'resultados'}
            </div>
          </div>
        </div>

        {/* Estado de carga y errores */}
        {loading && (
          <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-4 text-gray-600">Cargando ventas...</span>
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
              role="alert"
            >
              <p className="flex items-center">
                {error}
                <button 
                  onClick={fetchSales} 
                  className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Reintentar
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de ventas */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredSales.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                  <FiShoppingBag className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {sales.length === 0 
                    ? 'No hay ventas registradas' 
                    : 'No se encontraron ventas con los filtros actuales'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {sales.length === 0 
                    ? 'Comienza creando una nueva venta' 
                    : 'Intenta con otros términos de búsqueda'}
                </p>
                <button
                  onClick={() => navigate('/vendedor/sales/new')}
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg flex items-center mx-auto"
                >
                  <FiPlus className="mr-2" /> Crear nueva venta
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                {filteredSales.map((sale) => (
                  <SaleItem
                    key={`sale-${sale._id}`}
                    sale={sale}
                    onDelete={handleDelete}
                    onEdit={() => sale._id && navigate(`/vendedor/sales/edit/${sale._id}`)}
                    isDeleting={deletingId === sale._id}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesList;