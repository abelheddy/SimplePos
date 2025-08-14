// src/components/Sales/SaleItem.jsx
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SaleItem = ({ sale, onDelete, onEdit }) => {
  // Manejo seguro de fechas y montos
  const formattedDate = sale.timestamp 
    ? format(new Date(sale.timestamp * 1000), 'PPPp', { locale: es })
    : 'Fecha no disponible';

  const displayAmount = sale.amount 
    ? `$${typeof sale.amount === 'number' ? sale.amount.toFixed(2) : '0.00'}` 
    : '$0.00';

  return (
    <li className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <p className="text-lg font-medium text-blue-600 truncate">
              {sale.product || 'Producto no especificado'} - {sale.quantity || 0} unidad(es)
            </p>
            <p className="ml-2 text-sm text-gray-500">
              {formattedDate}
            </p>
          </div>
          <div className="mt-1 flex items-center">
            <p className="text-sm text-gray-900">
              Monto: {displayAmount}
            </p>
            {sale.productId && (
              <span className="ml-2 text-xs text-gray-500">
                ID: {sale.productId}
              </span>
            )}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex space-x-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(sale._id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Eliminar
          </button>
        </div>
      </div>
    </li>
  );
};

export default SaleItem;