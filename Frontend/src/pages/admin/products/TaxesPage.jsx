import React, { useState, useEffect } from 'react';
import { nodeAPI } from '../../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await nodeAPI.taxes.getAll();
      setTaxes(response.data);
    } catch (err) {
      console.error('Error fetching taxes:', err);
      setError(err.message || 'Error al cargar los tipos de IVA');
      toast.error('Error al cargar los tipos de IVA');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTax = async () => {
    if (!newTax.descripcion.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }
    
    if (!newTax.porcentaje || isNaN(parseFloat(newTax.porcentaje))) {
      toast.error('Porcentaje inválido');
      return;
    }
    
    try {
      const response = await nodeAPI.taxes.create({
        descripcion: newTax.descripcion,
        porcentaje: parseFloat(newTax.porcentaje)
      });
      
      setTaxes([...taxes, response.data]);
      setNewTax({ descripcion: '', porcentaje: '' });
      toast.success('Tipo de IVA agregado correctamente');
    } catch (err) {
      console.error('Error adding tax:', err);
      toast.error(err.message || 'Error al agregar el tipo de IVA');
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
    if (!editValue.descripcion.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }
    
    if (!editValue.porcentaje || isNaN(parseFloat(editValue.porcentaje))) {
      toast.error('Porcentaje inválido');
      return;
    }
    
    try {
      const updatedTax = await nodeAPI.taxes.update(id, {
        descripcion: editValue.descripcion,
        porcentaje: parseFloat(editValue.porcentaje)
      });
      
      setTaxes(taxes.map(t => 
        t.id_iva === id ? updatedTax.data : t
      ));
      setEditingId(null);
      toast.success('Tipo de IVA actualizado correctamente');
    } catch (err) {
      console.error('Error updating tax:', err);
      toast.error(err.message || 'Error al actualizar el tipo de IVA');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const deleteTax = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este tipo de IVA? Esta acción no se puede deshacer.')) return;
    
    try {
      await nodeAPI.taxes.delete(id);
      setTaxes(taxes.filter(tax => tax.id_iva !== id));
      toast.success('Tipo de IVA eliminado correctamente');
    } catch (err) {
      console.error('Error deleting tax:', err);
      toast.error(err.message || 'No se puede eliminar este tipo de IVA');
    }
  };

  if (loading && taxes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Cargando tipos de IVA...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Tipos de IVA</h1>
          <p className="text-gray-600 mt-2">Administra los diferentes tipos de impuestos para tus productos</p>
        </div>
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

      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Agregar Nuevo Tipo de IVA</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <input
                type="text"
                value={newTax.descripcion}
                onChange={(e) => setNewTax({...newTax, descripcion: e.target.value})}
                placeholder="Ej: IVA General, IVA Reducido, Exento"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje *</label>
              <div className="flex rounded-lg shadow-sm">
                <input
                  type="number"
                  value={newTax.porcentaje}
                  onChange={(e) => setNewTax({...newTax, porcentaje: e.target.value})}
                  placeholder="Ej: 16.00"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.01"
                  min="0"
                />
                <span className="inline-flex items-center px-4 text-gray-500 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg">
                  %
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleAddTax}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Agregar IVA
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Tipos de IVA Registrados</h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {taxes.length} tipos
            </span>
          </div>
        </div>
        
        {taxes.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay tipos de IVA registrados</h3>
            <p className="mt-1 text-gray-500">
              Comienza agregando un nuevo tipo de IVA usando el formulario superior.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Porcentaje
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taxes.map((tax) => (
                  <tr key={tax.id_iva} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tax.id_iva}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === tax.id_iva ? (
                        <input
                          type="text"
                          value={editValue.descripcion}
                          onChange={(e) => setEditValue({...editValue, descripcion: e.target.value})}
                          className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        tax.descripcion
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === tax.id_iva ? (
                        <div className="flex rounded-lg shadow-sm">
                          <input
                            type="number"
                            value={editValue.porcentaje}
                            onChange={(e) => setEditValue({...editValue, porcentaje: e.target.value})}
                            className="block w-full px-3 py-1 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            step="0.01"
                            min="0"
                          />
                          <span className="inline-flex items-center px-3 text-gray-500 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg">
                            %
                          </span>
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {tax.porcentaje}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === tax.id_iva ? (
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => saveEdit(tax.id_iva)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => startEditing(tax)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => deleteTax(tax.id_iva)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxesPage;