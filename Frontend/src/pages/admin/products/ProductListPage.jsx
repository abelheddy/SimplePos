import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // En la función fetchProducts
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/products');

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Procesamiento seguro de los datos
        const processedProducts = data.map(product => ({
          ...product,
          precio_compra: parseFloat(product.precio_compra) || 0,
          precio_venta: parseFloat(product.precio_venta) || 0,
          stock: parseInt(product.stock) || 0  // Asegura que stock sea número
        }));

        setProducts(processedProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de marcar este producto como inactivo?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/products/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Error al desactivar el producto');
        }

        setProducts(products.map(p =>
          p.id_producto === id ? { ...p, activo: false } : p
        ));
      } catch (err) {
        console.error('Error deleting product:', err);
        alert(err.message);
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.nombre.toLowerCase().includes(searchLower) ||
      (product.marca_nombre && product.marca_nombre.toLowerCase().includes(searchLower)) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
      (product.modelo && product.modelo.toLowerCase().includes(searchLower))
    );
  });

  const formatPrice = (price) => {
    // Asegurarnos que sea un número antes de formatear
    const num = typeof price === 'number' ? price : parseFloat(price) || 0;
    return num.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
        <p>Error al cargar productos: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Inventario de Laptops</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar por nombre, marca, modelo o SKU..."
            className="flex-1 px-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex gap-3">
            <Link
              to="/admin/products/categories"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
            >
              Marcas
            </Link>
            <Link
              to="/admin/products/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
            >
              + Nueva Laptop
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precios</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id_producto} className={!product.activo ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{product.nombre}</div>
                    <div className="text-sm text-gray-500">
                      {product.sku && `SKU: ${product.sku}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{product.marca_nombre || '-'}</div>
                    <div className="text-sm text-gray-500">{product.modelo || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{formatPrice(product.precio_venta)}</div>
                    <div className="text-sm text-gray-500">
                      {formatPrice(product.precio_compra)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.stock >= 0 ? product.stock : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!product.activo ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        Inactivo
                      </span>
                    ) : product.stock > 0 ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Disponible
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Agotado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => navigate(`/admin/products/edit/${product.id_producto}`)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product.id_producto)}
                        className={`text-sm ${product.activo ? 'text-red-600 hover:text-red-900' : 'text-gray-400 cursor-default'}`}
                        disabled={!product.activo}
                      >
                        {product.activo ? 'Desactivar' : 'Inactivo'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          {products.length === 0 ? (
            <p>No hay productos registrados. <Link to="/admin/products/create" className="text-blue-600">Crea el primero</Link></p>
          ) : (
            <p>No se encontraron productos que coincidan con la búsqueda.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductListPage;