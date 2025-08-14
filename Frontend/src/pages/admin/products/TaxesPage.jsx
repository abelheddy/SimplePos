import React, { useState, useEffect } from 'react';

const TaxesPage = () => {
  const [taxes, setTaxes] = useState([]);
  const [newTax, setNewTax] = useState({
    descripcion: '',
    porcentaje: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({
    descripcion: '',
    porcentaje: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/taxes');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTaxes(data);
    } catch (err) {
      console.error('Error fetching taxes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTax = async () => {
    if (!newTax.descripcion.trim() || !newTax.porcentaje) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/taxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descripcion: newTax.descripcion,
          porcentaje: parseFloat(newTax.porcentaje)
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTaxes([...taxes, data]);
      setNewTax({ descripcion: '', porcentaje: '' });
    } catch (err) {
      console.error('Error adding tax:', err);
      alert(`Error al agregar IVA: ${err.message}`);
    }
  };

  const startEditing = (tax) => {
    setEditingId(tax.id_iva);
    setEditValue({
      descripcion: tax.descripcion,
      porcentaje: tax.porcentaje.toString()
    });
  };

  const saveEdit = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/taxes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descripcion: editValue.descripcion,
          porcentaje: parseFloat(editValue.porcentaje)
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const updatedTax = await response.json();
      setTaxes(taxes.map(t => 
        t.id_iva === id ? { ...t, ...updatedTax } : t
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating tax:', err);
      alert(`Error al actualizar IVA: ${err.message}`);
    }
  };

  const deleteTax = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este tipo de IVA?')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/taxes/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      setTaxes(taxes.filter(tax => tax.id_iva !== id));
    } catch (err) {
      console.error('Error deleting tax:', err);
      alert('No se puede eliminar: ' + err.message);
    }
  };

  if (loading && taxes.length === 0) {
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
          onClick={fetchTaxes}
          className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestión de Tipos de IVA</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Tipo de IVA</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descripción *</label>
            <input
              type="text"
              value={newTax.descripcion}
              onChange={(e) => setNewTax({...newTax, descripcion: e.target.value})}
              placeholder="Ej: IVA General, IVA Reducido, Exento"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Porcentaje *</label>
            <div className="flex">
              <input
                type="number"
                value={newTax.porcentaje}
                onChange={(e) => setNewTax({...newTax, porcentaje: e.target.value})}
                placeholder="Ej: 16.00"
                className="w-full px-4 py-2 border rounded-lg"
                step="0.01"
                min="0"
              />
              <span className="flex items-center px-3 bg-gray-100 rounded-r-lg">%</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleAddTax}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Agregar IVA
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Tipos de IVA Registrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taxes.map((tax) => (
                <tr key={tax.id_iva}>
                  <td className="px-6 py-4 whitespace-nowrap">{tax.id_iva}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === tax.id_iva ? (
                      <input
                        type="text"
                        value={editValue.descripcion}
                        onChange={(e) => setEditValue({...editValue, descripcion: e.target.value})}
                        className="px-2 py-1 border rounded w-full"
                      />
                    ) : (
                      tax.descripcion
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === tax.id_iva ? (
                      <div className="flex">
                        <input
                          type="number"
                          value={editValue.porcentaje}
                          onChange={(e) => setEditValue({...editValue, porcentaje: e.target.value})}
                          className="px-2 py-1 border rounded w-full"
                          step="0.01"
                          min="0"
                        />
                        <span className="flex items-center px-2">%</span>
                      </div>
                    ) : (
                      `${tax.porcentaje}%`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === tax.id_iva ? (
                      <>
                        <button
                          onClick={() => saveEdit(tax.id_iva)}
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
                          onClick={() => startEditing(tax)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteTax(tax.id_iva)}
                          className="text-red-600 hover:text-red-900"
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

export default TaxesPage;