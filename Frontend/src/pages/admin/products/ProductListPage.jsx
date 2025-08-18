import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { nodeAPI } from '../../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCount, setFilteredCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await nodeAPI.products.getAll();
        const data = response.data;

        // Procesamiento seguro de los datos
        const processedProducts = data.map(product => ({
          ...product,
          precio_compra: parseFloat(product.precio_compra) || 0,
          precio_venta: parseFloat(product.precio_venta) || 0,
          stock: parseInt(product.stock) || 0  // Asegura que stock sea número
        }));

        setProducts(processedProducts);
        setFilteredCount(processedProducts.length);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Error al cargar los productos');
        toast.error('Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de marcar este producto como inactivo? Esta acción no se puede deshacer.')) {
      try {
        await nodeAPI.products.delete(id);

        setProducts(products.map(p =>
          p.id_producto === id ? { ...p, activo: false } : p
        ));
        
        toast.success('Producto marcado como inactivo');
      } catch (err) {
        console.error('Error deleting product:', err);
        toast.error(err.message || 'Error al desactivar el producto');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    const matches = (
      product.nombre.toLowerCase().includes(searchLower) ||
      (product.marca_nombre && product.marca_nombre.toLowerCase().includes(searchLower)) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
      (product.modelo && product.modelo.toLowerCase().includes(searchLower))
    );
    
    if (matches && searchTerm) {
      setFilteredCount(prev => prev + 1);
    }
    
    return matches;
  });

  useEffect(() => {
    setFilteredCount(filteredProducts.length);
  }, [filteredProducts]);

  const formatPrice = (price) => {
    // Asegurarnos que sea un número antes de formatear
    const num = typeof price === 'number' ? price : parseFloat(price) || 0;
    return num.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    });
  };

  const calculateProfit = (product) => {
    const profit = product.precio_venta - product.precio_compra;
    const profitMargin = product.precio_compra > 0 
      ? (profit / product.precio_compra) * 100 
      : 0;
    
    return {
      profit: profit.toFixed(2),
      margin: profitMargin.toFixed(2)
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error al cargar productos: {error}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario de Productos</h1>
          <p className="text-gray-600 mt-2">Administra todos los productos de tu inventario</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar por nombre, marca, modelo o SKU..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/admin/products/brands"
              className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Marcas
            </Link>
            <Link
              to="/admin/products/create"
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nuevo Producto
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{filteredCount}</span> de <span className="font-medium">{products.length}</span> productos
        </div>
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            Limpiar filtros
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">No hay productos</h3>
            <p className="mt-2 text-gray-500">
              {products.length === 0
                ? 'Aún no has agregado ningún producto.'
                : 'No se encontraron productos que coincidan con tu búsqueda.'}
            </p>
            <div className="mt-6">
              <Link
                to="/admin/products/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Agregar Producto
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marca / Modelo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precios
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const profitData = calculateProfit(product);
                  
                  return (
                    <tr key={product.id_producto} className={!product.activo ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{product.nombre}</div>
                            <div className="text-sm text-gray-500">
                              {product.sku && `SKU: ${product.sku}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{product.marca_nombre || '-'}</div>
                        <div className="text-sm text-gray-500">{product.modelo || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-green-600">{formatPrice(product.precio_venta)}</div>
                        <div className="text-sm text-gray-500">
                          Compra: {formatPrice(product.precio_compra)}
                        </div>
                        <div className="text-xs mt-1">
                          <span className="text-green-600">+{profitData.profit} </span>
                          <span className="text-gray-500">({profitData.margin}%)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {product.stock} unidades
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Valor: {formatPrice(product.precio_compra * product.stock)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!product.activo ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-800">
                            Inactivo
                          </span>
                        ) : product.stock > 0 ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Disponible
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Agotado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => navigate(`/admin/products/edit/${product.id_producto}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id_producto)}
                            className={`${product.activo ? 'text-red-600 hover:text-red-900' : 'text-gray-400'}`}
                            disabled={!product.activo}
                            title={product.activo ? "Desactivar" : "Inactivo"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;