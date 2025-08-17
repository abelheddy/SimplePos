import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nodeAPI } from '../../../services/api'; // Ajusta la ruta según tu estructura

const ProductCreatePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    modelo: '',
    precio_compra: 0,
    precio_venta: 0,
    sku: '',
    codigo_barras: '',
    id_marca: '',
    id_iva: '',
    stock: 0
  });

  const [brands, setBrands] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar marcas e IVAs usando el API centralizado
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener marcas usando nodeAPI
        const brandsResponse = await nodeAPI.brands.getAll();
        const brandsData = brandsResponse.data;

        // Obtener impuestos (taxes) usando nodeAPI
        const taxesResponse = await nodeAPI.taxes.getAll();
        const taxesData = taxesResponse.data;

        setBrands(brandsData);
        setTaxes(taxesData);

        // Establecer valores por defecto si hay datos
        if (brandsData.length > 0 && taxesData.length > 0) {
          setFormData(prev => ({
            ...prev,
            id_marca: brandsData[0].id_marca,
            id_iva: taxesData[0].id_iva
          }));
        }
      } catch (err) {
        setError(err.message || 'Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validación básica
      if (!formData.nombre || !formData.modelo || !formData.sku) {
        throw new Error('Nombre, modelo y SKU son obligatorios');
      }

      // Preparar payload
      const payload = {
        ...formData,
        precio_compra: parseFloat(formData.precio_compra) || 0,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        stock: parseInt(formData.stock) || 0
      };

      // Crear producto usando nodeAPI
      const productResponse = await nodeAPI.products.create(payload);
      const productData = productResponse.data;

      // Crear registro en inventario usando nodeAPI
      await nodeAPI.inventory.create({
        id_producto: productData.id_producto,
        cantidad: payload.stock,
        ubicacion: 'Almacén principal'
      });

      navigate('/admin/products');
    } catch (err) {
      console.error('Error en creación de producto:', err);
      setError(err.response?.data?.error || err.message || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  if (loading && brands.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Registrar Nueva Laptop</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ... (campos del formulario se mantienen iguales) ... */}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductCreatePage;