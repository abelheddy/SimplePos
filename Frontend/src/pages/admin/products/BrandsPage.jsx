import React, { useState, useEffect } from 'react';

const BrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [newBrand, setNewBrand] = useState({ nombre: '', descripcion: '' });
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ nombre: '', descripcion: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/brands');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand.nombre.trim()) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBrand)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBrands([...brands, data]);
      setNewBrand({ nombre: '', descripcion: '' });
    } catch (err) {
      console.error('Error adding brand:', err);
      alert(`Error al agregar marca: ${err.message}`);
    }
  };

  const startEditing = (brand) => {
    setEditingId(brand.id_marca);
    setEditValue({
      nombre: brand.nombre,
      descripcion: brand.descripcion || ''
    });
  };

  const saveEdit = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/brands/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editValue)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const updatedBrand = await response.json();
      setBrands(brands.map(b => 
        b.id_marca === id ? { ...b, ...updatedBrand } : b
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating brand:', err);
      alert(`Error al actualizar marca: ${err.message}`);
    }
  };

  const deleteBrand = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta marca?')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/brands/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      setBrands(brands.filter(brand => brand.id_marca !== id));
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert('No se puede eliminar: ' + err.message);
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
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <button 
          onClick={fetchBrands}
          className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestión de Marcas</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Agregar Nueva Marca</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              value={newBrand.nombre}
              onChange={(e) => setNewBrand({...newBrand, nombre: e.target.value})}
              placeholder="Nombre de la marca"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <input
              type="text"
              value={newBrand.descripcion}
              onChange={(e) => setNewBrand({...newBrand, descripcion: e.target.value})}
              placeholder="Descripción (opcional)"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={handleAddBrand}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Agregar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Lista de Marcas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brands.map((brand) => (
                <tr key={brand.id_marca}>
                  <td className="px-6 py-4 whitespace-nowrap">{brand.id_marca}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === brand.id_marca ? (
                      <input
                        type="text"
                        value={editValue.nombre}
                        onChange={(e) => setEditValue({...editValue, nombre: e.target.value})}
                        className="px-2 py-1 border rounded w-full"
                      />
                    ) : (
                      brand.nombre
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === brand.id_marca ? (
                      <input
                        type="text"
                        value={editValue.descripcion}
                        onChange={(e) => setEditValue({...editValue, descripcion: e.target.value})}
                        className="px-2 py-1 border rounded w-full"
                      />
                    ) : (
                      brand.descripcion || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{brand.product_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === brand.id_marca ? (
                      <>
                        <button
                          onClick={() => saveEdit(brand.id_marca)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(brand)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteBrand(brand.id_marca)}
                          className="text-red-600 hover:text-red-900"
                          disabled={brand.product_count > 0}
                          title={brand.product_count > 0 ? "No se puede eliminar con productos asociados" : ""}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BrandsPage;