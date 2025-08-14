import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  // Cargar marcas e IVAs al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener marcas
        const brandsResponse = await fetch('http://localhost:3000/api/brands');
        if (!brandsResponse.ok) throw new Error('Error al cargar marcas');
        const brandsData = await brandsResponse.json();

        // Obtener IVAs (taxes)
        const taxesResponse = await fetch('http://localhost:3000/api/taxes');
        if (!taxesResponse.ok) throw new Error('Error al cargar tipos de IVA');
        const taxesData = await taxesResponse.json();

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
        setError(err.message);
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

      // Convertir números
      const payload = {
        ...formData,
        precio_compra: parseFloat(formData.precio_compra) || 0,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        stock: parseInt(formData.stock) || 0
      };

      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear producto');
      }

      const productData = await response.json();

      // Crear registro en inventario
      const inventoryResponse = await fetch('http://localhost:3000/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_producto: productData.id_producto,
          cantidad: payload.stock,
          ubicacion: 'Almacén principal'
        })
      });

      if (!inventoryResponse.ok) {
        throw new Error('Producto creado pero falló registro en inventario');
      }

      navigate('/admin/products');
    } catch (err) {
      console.error('Error en creación de producto:', err);
      setError(err.message);
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
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Nombre del Producto *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
                placeholder="Ej: Laptop HP Pavilion 15-dw1000la"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
                placeholder="Especificaciones técnicas, características destacadas..."
              />
            </div>

            {/* Modelo */}
            <div>
              <label className="block text-gray-700 mb-2">Modelo *</label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
                placeholder="Ej: 15-dw1000la"
              />
            </div>

            {/* Marca */}
            <div>
              <label className="block text-gray-700 mb-2">Marca *</label>
              <select
                name="id_marca"
                value={formData.id_marca}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                {brands.map(brand => (
                  <option key={brand.id_marca} value={brand.id_marca}>
                    {brand.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio de Compra */}
            <div>
              <label className="block text-gray-700 mb-2">Precio de Compra ($) *</label>
              <input
                type="number"
                name="precio_compra"
                value={formData.precio_compra}
                onChange={handleNumberChange}
                className="w-full px-4 py-2 border rounded-lg"
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* Precio de Venta */}
            <div>
              <label className="block text-gray-700 mb-2">Precio de Venta ($) *</label>
              <input
                type="number"
                name="precio_venta"
                value={formData.precio_venta}
                onChange={handleNumberChange}
                className="w-full px-4 py-2 border rounded-lg"
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-gray-700 mb-2">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
                placeholder="Código único del producto"
              />
            </div>

            {/* Código de Barras */}
            <div>
              <label className="block text-gray-700 mb-2">Código de Barras</label>
              <input
                type="text"
                name="codigo_barras"
                value={formData.codigo_barras}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Opcional"
              />
            </div>

            {/* Tipo de IVA */}
            <div>
              <label className="block text-gray-700 mb-2">Tipo de IVA *</label>
              <select
                name="id_iva"
                value={formData.id_iva}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                {taxes.map(tax => (
                  <option key={tax.id_iva} value={tax.id_iva}>
                    {tax.descripcion} ({tax.porcentaje}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Inicial */}
            <div>
              <label className="block text-gray-700 mb-2">Stock Inicial *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleNumberChange}
                className="w-full px-4 py-2 border rounded-lg"
                min="0"
                required
              />
            </div>
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