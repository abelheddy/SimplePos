import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { nodeAPI } from '../../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [brands, setBrands] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [inventoryId, setInventoryId] = useState(null);
  const [inventoryLocation, setInventoryLocation] = useState('');
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
        setError(null);

        // Obtener marcas y tipos de IVA en paralelo
        const [brandsResponse, taxesResponse] = await Promise.all([
          nodeAPI.brands.getAll(),
          nodeAPI.taxes.getAll()
        ]);

        setBrands(brandsResponse.data);
        setTaxes(taxesResponse.data);

        // Obtener datos del producto
        const productResponse = await nodeAPI.products.getById(id);
        const productData = productResponse.data;

        // Obtener inventario del producto
        try {
          const inventoryResponse = await nodeAPI.inventory.getByProduct(id);
          
          if (inventoryResponse.data && inventoryResponse.data.length > 0) {
            const inventoryItem = inventoryResponse.data[0];
            setInventoryId(inventoryItem.id_inventario);
            setInventoryLocation(inventoryItem.ubicacion || '');
            setFormData(prev => ({
              ...prev,
              stock: inventoryItem.cantidad || 0
            }));
          } else {
            toast.info('No se encontró registro de inventario para este producto');
          }
        } catch (inventoryError) {
          console.error('Error obteniendo inventario:', inventoryError);
          toast.error('Error al cargar el inventario');
        }

        // Establecer datos del producto en el formulario
        setFormData(prev => ({
          ...prev,
          nombre: productData.nombre || '',
          descripcion: productData.descripcion || '',
          modelo: productData.modelo || '',
          precio_compra: productData.precio_compra || 0,
          precio_venta: productData.precio_venta || 0,
          sku: productData.sku || '',
          codigo_barras: productData.codigo_barras || '',
          id_marca: productData.id_marca || (brandsResponse.data[0]?.id_marca || ''),
          id_iva: productData.id_iva || (taxesResponse.data[0]?.id_iva || '')
        }));
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err.message || 'Error al cargar los datos del producto');
        toast.error('Error al cargar los datos del producto');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

  const calculateProfit = () => {
    const profit = formData.precio_venta - formData.precio_compra;
    const profitMargin = formData.precio_compra > 0 
      ? (profit / formData.precio_compra) * 100 
      : 0;
    
    return {
      profit: profit.toFixed(2),
      margin: profitMargin.toFixed(2)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validación mejorada
      if (!formData.nombre.trim()) throw new Error('El nombre es obligatorio');
      if (!formData.modelo.trim()) throw new Error('El modelo es obligatorio');
      if (!formData.sku.trim()) throw new Error('El SKU es obligatorio');
      if (formData.precio_venta < formData.precio_compra) {
        throw new Error('El precio de venta debe ser mayor al de compra');
      }

      const productPayload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        modelo: formData.modelo,
        precio_compra: parseFloat(formData.precio_compra),
        precio_venta: parseFloat(formData.precio_venta),
        sku: formData.sku,
        codigo_barras: formData.codigo_barras,
        id_marca: formData.id_marca,
        id_iva: formData.id_iva
      };

      // 1. Actualizar el producto
      await nodeAPI.products.update(id, productPayload);
      
      // 2. Actualizar o crear el inventario
      const inventoryPayload = {
        cantidad: parseInt(formData.stock) || 0,
        ubicacion: inventoryLocation
      };

      if (inventoryId) {
        await nodeAPI.inventory.update(inventoryId, inventoryPayload);
      } else {
        // Crear nuevo registro de inventario
        await nodeAPI.inventory.create({
          ...inventoryPayload,
          id_producto: id
        });
      }

      toast.success('¡Producto actualizado correctamente!');
      setTimeout(() => navigate('/admin/products'), 1500);
    } catch (err) {
      console.error('Error actualizando producto:', err);
      setError(err.message);
      toast.error(err.message || 'Error al actualizar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  const { profit, margin } = calculateProfit();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Cargando datos del producto...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Editar Producto: <span className="text-blue-600">{formData.nombre}</span>
        </h1>
        <button 
          onClick={() => navigate('/admin/products')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Volver a productos
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Columna Izquierda - Información Básica */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">Información Básica</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="Ej. Smartphone Galaxy S21"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Describe las características del producto..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                    <input
                      type="text"
                      name="modelo"
                      value={formData.modelo}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="Ej. SM-G991B"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                      <select
                        name="id_marca"
                        value={formData.id_marca}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Seleccionar marca</option>
                        {brands.map(brand => (
                          <option key={brand.id_marca} value={brand.id_marca}>
                            {brand.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de IVA *</label>
                      <select
                        name="id_iva"
                        value={formData.id_iva}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Seleccionar IVA</option>
                        {taxes.map(tax => (
                          <option key={tax.id_iva} value={tax.id_iva}>
                            {tax.descripcion} ({tax.porcentaje}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">Identificación</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="Código único de identificación"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                    <input
                      type="text"
                      name="codigo_barras"
                      value={formData.codigo_barras}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Columna Derecha - Precios e Inventario */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">Precios</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Compra ($) *</label>
                    <input
                      type="number"
                      name="precio_compra"
                      value={formData.precio_compra}
                      onChange={handleNumberChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta ($) *</label>
                    <input
                      type="number"
                      name="precio_venta"
                      value={formData.precio_venta}
                      onChange={handleNumberChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Ganancia por unidad:</p>
                        <p className="text-lg font-semibold text-blue-700">${profit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Margen de ganancia:</p>
                        <p className="text-lg font-semibold text-blue-700">{margin}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">Inventario</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual *</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleNumberChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                        unidades
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación en almacén</label>
                    <input
                      type="text"
                      value={inventoryLocation}
                      onChange={(e) => setInventoryLocation(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Estante A, Nivel 3"
                    />
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">
                          Valor del inventario: <span className="font-medium">${(formData.precio_compra * formData.stock).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pie de página con botones */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center disabled:bg-blue-400"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditPage;