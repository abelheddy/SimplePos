// src/components/Sales/CreateSaleForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesAPI } from '../../services/api';

const CreateSaleForm = () => {
  const [saleData, setSaleData] = useState({
    product: '',
    quantity: 1,
    amount: 0,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSaleData({
      ...saleData,
      [name]: name === 'quantity' ? parseInt(value) : name === 'amount' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!saleData.product || saleData.quantity <= 0 || saleData.amount <= 0) {
      setError('Todos los campos son requeridos y deben ser valores positivos');
      setIsSubmitting(false);
      return;
    }

    try {
      await salesAPI.create(saleData);
      navigate('/sales');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la venta');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Nueva Venta</h2>
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="product">
            Producto
          </label>
          <input
            type="text"
            id="product"
            name="product"
            value={saleData.product}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="quantity">
            Cantidad
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={saleData.quantity}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="amount">
            Monto Total
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            min="0.01"
            step="0.01"
            value={saleData.amount}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Registrando...' : 'Registrar Venta'}
        </button>
      </form>
    </div>
  );
};

export default CreateSaleForm;