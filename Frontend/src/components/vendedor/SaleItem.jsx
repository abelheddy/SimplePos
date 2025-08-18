import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiEdit2, FiTrash2, FiShoppingBag, FiCalendar, FiDollarSign, FiCheck } from 'react-icons/fi';

const SaleItem = ({ sale, onDelete, onEdit, isDeleting }) => {
  // Depuración: Mostrar los datos de la venta
  console.log('SaleItem data:', sale);
  
  // Manejo seguro de fechas y montos
  const formattedDate = sale.timestamp 
    ? format(new Date(sale.timestamp * 1000), 'dd MMM yyyy, HH:mm', { locale: es })
    : 'Fecha no disponible';

  const displayAmount = sale.amount 
    ? `$${typeof sale.amount === 'number' ? sale.amount.toFixed(2) : '0.00'}` 
    : '$0.00';
  
  const productName = sale.product || 'Producto no especificado';
  const quantity = sale.quantity || 0;
  const hasValidId = !!sale._id;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5 mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        {/* Información principal */}
        <div className="flex-1 min-w-0 mb-4 md:mb-0">
          <div className="flex items-center mb-3">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <FiShoppingBag className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 truncate">
                {productName}
              </h3>
              <p className="flex items-center text-sm text-gray-500 mt-1">
                <FiCalendar className="mr-1" /> {formattedDate}
              </p>
            </div>
          </div>
          
          <div className="ml-10 flex flex-wrap gap-4">
            <div className="flex items-center">
              <span className="bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
                {quantity} unidad{quantity !== 1 ? 'es' : ''}
              </span>
            </div>
            
            <div className="flex items-center">
              <FiDollarSign className="text-gray-500 mr-1" />
              <span className="font-medium text-gray-700">{displayAmount}</span>
            </div>
            
            {hasValidId && (
              <div className="hidden md:block">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                  ID: {sale._id.substring(0, 8)}...
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Estado y acciones */}
        <div className="flex flex-col md:items-end gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 self-start md:self-auto">
            <FiCheck className="inline mr-1" /> Completada
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className={`px-3 py-2 border rounded-lg flex items-center ${
                hasValidId 
                  ? 'bg-white border-gray-300 hover:bg-gray-50' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!hasValidId || isDeleting}
            >
              <FiEdit2 className="mr-1" /> Editar
            </button>
            <button
              onClick={() => hasValidId && onDelete(sale._id)}
              className={`px-3 py-2 border rounded-lg flex items-center ${
                hasValidId 
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!hasValidId || isDeleting}
            >
              <FiTrash2 className="mr-1" /> 
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleItem;