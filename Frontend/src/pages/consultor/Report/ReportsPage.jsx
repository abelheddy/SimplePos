import React, { useState, useEffect } from 'react';
import { salesAPI } from '../../../services/api';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ReportsPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [stats, setStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    averageSale: 0,
    topProducts: []
  });

  // Obtener reportes de ventas
  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await salesAPI.getReport(
        format(dateRange.start, 'yyyy-MM-dd'),
        format(dateRange.end, 'yyyy-MM-dd')
      );

      if (!response.data) {
        throw new Error('Formato de respuesta inesperado');
      }

      setSales(response.data.sales || []);
      
      // Calcular estadísticas
      const totalSales = response.data.sales?.length || 0;
      const totalAmount = response.data.sales?.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) || 0;
      
      // Calcular productos más vendidos
      const productMap = {};
      response.data.sales?.forEach(sale => {
        sale.items?.forEach(item => {
          if (item.productName) {
            productMap[item.productName] = (productMap[item.productName] || 0) + (item.quantity || 0);
          }
        });
      });
      
      const topProducts = Object.entries(productMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

      setStats({
        totalSales,
        totalAmount,
        averageSale: totalSales > 0 ? totalAmount / totalSales : 0,
        topProducts
      });
    } catch (err) {
      console.error('Error fetching sales report:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, [dateRange]);

  // Datos para gráfico de ventas por día
  const getDailySalesData = () => {
    const daysMap = {};
    const days = [];
    
    // Agrupar ventas por día
    sales.forEach(sale => {
      const date = format(new Date(sale.timestamp * 1000), 'yyyy-MM-dd');
      daysMap[date] = (daysMap[date] || 0) + (sale.totalAmount || 0);
    });
    
    // Ordenar días
    const sortedDays = Object.keys(daysMap).sort();
    sortedDays.forEach(day => {
      days.push({
        date: day,
        amount: daysMap[day]
      });
    });
    
    return {
      labels: days.map(day => format(new Date(day.date), 'dd MMM', { locale: es })),
      data: days.map(day => day.amount)
    };
  };

  // Configuración de gráficos
  const dailySalesData = getDailySalesData();
  
  const barChartData = {
    labels: dailySalesData.labels,
    datasets: [
      {
        label: 'Ventas por día',
        data: dailySalesData.data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }
    ]
  };

  const pieChartData = {
    labels: stats.topProducts.map(p => p.name),
    datasets: [
      {
        data: stats.topProducts.map(p => p.quantity),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(139, 92, 246, 0.7)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Ventas diarias'
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right'
      },
      title: {
        display: true,
        text: 'Productos más vendidos'
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reporte de Ventas</h1>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicial</label>
            <input
              type="date"
              value={format(dateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({...dateRange, start: new Date(e.target.value)})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha final</label>
            <input
              type="date"
              value={format(dateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({...dateRange, end: new Date(e.target.value)})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchSalesReport}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
                <button 
                  onClick={fetchSalesReport} 
                  className="ml-2 text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
                >
                  Reintentar
                </button>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Resumen estadístico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ventas totales</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalSales}</p>
              <p className="text-sm text-gray-500 mt-1">Período seleccionado</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ganancias totales</h3>
              <p className="text-3xl font-bold text-green-600">
                ${stats.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-500 mt-1">Suma de todas las ventas</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket promedio</h3>
              <p className="text-3xl font-bold text-yellow-600">
                ${stats.averageSale.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-500 mt-1">Valor promedio por venta</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>

          {/* Tabla de ventas recientes */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Ventas recientes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Últimas 10 ventas del período seleccionado
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.slice(0, 10).map((sale) => (
                    <tr key={`recent-sale-${sale._id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(sale.timestamp * 1000), 'PPpp', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.sellerName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.sellerID || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {sale.items?.length || 0} producto(s)
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.items?.[0]?.productName || ''}
                          {sale.items?.length > 1 ? ` +${sale.items.length - 1} más` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${(sale.totalAmount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;