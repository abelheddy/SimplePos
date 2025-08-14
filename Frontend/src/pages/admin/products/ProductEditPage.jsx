import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brands, setBrands] = useState([]);
  const [taxes, setTaxes] = useState([]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener marcas
        const brandsResponse = await fetch('http://localhost:3000/api/brands');
        if (!brandsResponse.ok) throw new Error('Error cargando marcas');
        const brandsData = await brandsResponse.json();

        // Obtener tipos de IVA
        const taxesResponse = await fetch('http://localhost:3000/api/taxes');
        if (!taxesResponse.ok) throw new Error('Error cargando tipos de IVA');
        const taxesData = await taxesResponse.json();

        // Obtener datos del producto
        const productResponse = await fetch(`http://localhost:3000/api/products/${id}`);
        if (!productResponse.ok) throw new Error('Error cargando producto');
        const productData = await productResponse.json();

        setBrands(brandsData);
        setTaxes(taxesData);

        // Establecer datos del producto en el formulario
        setFormData({
          nombre: productData.nombre || '',
          descripcion: productData.descripcion || '',
          modelo: productData.modelo || '',
          precio_compra: productData.precio_compra || 0,
          precio_venta: productData.precio_venta || 0,
          sku: productData.sku || '',
          codigo_barras: productData.codigo_barras || '',
          id_marca: productData.id_marca || brandsData[0]?.id_marca || '',
          id_iva: productData.id_iva || taxesData[0]?.id_iva || '',
          stock: productData.stock || 0
        });
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        navigate('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

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
      [name]: value === '' ? '' : Number(value)
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

      const payload = {
        ...formData,
        precio_compra: parseFloat(formData.precio_compra) || 0,
        precio_venta: parseFloat(formData.precio_venta) || 0
      };

      // 1. Actualizar el producto
      const response = await fetch(`http://localhost:3000/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar producto');
      }

      // 2. Actualizar el inventario
      const inventoryResponse = await fetch(`http://localhost:3000/api/inventory/product/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cantidad: parseInt(formData.stock) || 0
        })
      });

      if (!inventoryResponse.ok) {
        const errorData = await inventoryResponse.json();
        console.error('Error en inventario:', errorData);
        throw new Error('Producto actualizado pero hubo un problema con el inventario');
      }

      navigate('/admin/products');
    } catch (err) {
      console.error('Error actualizando producto:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Producto: {formData.nombre}</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Nombre del Producto *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Modelo *</label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

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

            <div>
              <label className="block text-gray-700 mb-2">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Código de Barras</label>
              <input
                type="text"
                name="codigo_barras"
                value={formData.codigo_barras}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

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

            <div>
              <label className="block text-gray-700 mb-2">Stock Actual *</label>
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
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-2">↻</span>
                  Guardando...
                </>
              ) : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditPage;