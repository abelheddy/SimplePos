// src/components/Sales/SalesList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesAPI } from '../../services/api';
import SaleItem from './SaleItem';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await salesAPI.getAll();
        if (response.data) {
          setSales(response.data);
        } else {
          setError('Formato de respuesta inesperado');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar las ventas');
        console.error('Error fetching sales:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta venta?')) {
      try {
        await salesAPI.delete(id);
        setSales(prevSales => prevSales.filter(sale => sale._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar la venta');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando ventas...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Ventas</h1>
        <button
          onClick={() => navigate('/vendedor/sales/new')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Nueva Venta
        </button>
      </div>

      {sales.length === 0 ? (
        <div className="text-center py-8">
          <p>No hay ventas registradas</p>
          <button
            onClick={() => navigate('/vendedor/sales/new')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Crear mi primera venta
          </button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {sales.map((sale) => (
              <SaleItem 
                key={`sale-${sale._id}`}
                sale={sale} 
                onDelete={handleDelete}
                onEdit={() => navigate(`/vendedor/sales/edit/${sale._id}`)} 
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SalesList;