import React, { useState, useEffect, useRef } from 'react';
import { salesAPI } from '../../../services/api';
import { format, subDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import { FiDownload, FiRefreshCw, FiPrinter, FiFilter, FiTrendingUp, FiShoppingCart, FiDollarSign, FiBarChart2, FiPieChart } from 'react-icons/fi';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
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
    topProducts: [],
    salesByHour: Array(24).fill(0),
    conversionRate: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState('bar');
  const reportRef = useRef(null);

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
      
      // Calcular ventas por hora
      const salesByHour = Array(24).fill(0);
      response.data.sales?.forEach(sale => {
        const hour = new Date(sale.timestamp * 1000).getHours();
        salesByHour[hour] += sale.totalAmount;
      });

      // Calcular tasa de conversión (ventas/visitas)
      const conversionRate = totalSales > 0 ? Math.min(100, Math.round((totalSales / 150) * 100)) : 0; // Suponiendo 150 visitas

      setStats({
        totalSales,
        totalAmount,
        averageSale: totalSales > 0 ? totalAmount / totalSales : 0,
        topProducts,
        salesByHour,
        conversionRate
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
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  const lineChartData = {
    labels: dailySalesData.labels,
    datasets: [
      {
        label: 'Ventas por día',
        data: dailySalesData.data,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)'
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

  const hourlySalesData = {
    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Ventas por hora',
        data: stats.salesByHour,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif"
          }
        }
      },
      title: {
        display: true,
        text: 'Ventas diarias',
        font: {
          size: 16,
          family: "'Inter', sans-serif"
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 14
        },
        callbacks: {
          label: function(context) {
            return `$${context.raw.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString('es-ES');
          }
        },
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const lineChartOptions = {
    ...barChartOptions,
    plugins: {
      ...barChartOptions.plugins,
      title: {
        ...barChartOptions.plugins.title,
        text: 'Tendencia de ventas'
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Productos más vendidos',
        font: {
          size: 16,
          family: "'Inter', sans-serif"
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw} unidades`;
          }
        }
      }
    }
  };

  const hourlyChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif"
          }
        }
      },
      title: {
        display: true,
        text: 'Ventas por hora del día',
        font: {
          size: 16,
          family: "'Inter', sans-serif"
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 14
        },
        callbacks: {
          label: function(context) {
            return `$${context.raw.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString('es-ES');
          }
        },
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      }
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;
    
    setLoading(true);
    
    try {
      // Capturar el reporte como imagen
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Agregar más páginas si el contenido es largo
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Agregar tabla de datos
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Detalle de Ventas', 105, 15, { align: 'center' });
      
      // Preparar datos para la tabla
      const tableData = sales.map(sale => [
        format(new Date(sale.timestamp * 1000), 'dd/MM/yyyy HH:mm'),
        sale.sellerName || 'N/A',
        sale.items?.length || 0,
        `$${sale.totalAmount?.toFixed(2) || '0.00'}`
      ]);
      
      // Crear tabla con autotable
      autoTable(doc, {
        head: [['Fecha', 'Vendedor', 'Productos', 'Total']],
        body: tableData,
        startY: 25,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3
        }
      });
      
      // Guardar PDF
      doc.save(`reporte-ventas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      setError('Error al generar el reporte PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FiBarChart2 className="mr-3 text-blue-500" />
              Reporte de Ventas
            </h1>
            <p className="text-gray-600 mt-1">Análisis detallado del rendimiento de ventas</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={generatePDF}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg flex items-center"
              disabled={loading}
            >
              <FiDownload className="mr-2" /> Exportar PDF
            </button>
            
            <button
              onClick={fetchSalesReport}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              disabled={loading}
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-lg mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FiFilter className="mr-2 text-blue-500" />
              Filtros
            </h2>
            <div className="text-sm text-gray-500">
              {format(dateRange.start, 'dd MMM yyyy', { locale: es })} - {format(dateRange.end, 'dd MMM yyyy', { locale: es })}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicial</label>
              <input
                type="date"
                value={format(dateRange.start, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange({...dateRange, start: new Date(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha final</label>
              <input
                type="date"
                value={format(dateRange.end, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange({...dateRange, end: new Date(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de gráfico</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="bar">Barras</option>
                <option value="line">Líneas</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchSalesReport}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <FiFilter className="mr-2" /> Aplicar filtros
              </button>
            </div>
          </div>
        </motion.div>

        {/* Contenido del reporte */}
        <div ref={reportRef} className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Tabs de navegación */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('overview')}
            >
              Resumen
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('products')}
            >
              Productos
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'sales' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('sales')}
            >
              Detalle de ventas
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-gray-600">Cargando reporte...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
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
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-700">Ventas totales</h3>
                          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalSales}</p>
                        </div>
                        <div className="bg-blue-500 p-3 rounded-lg">
                          <FiShoppingCart className="text-white text-xl" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">Período seleccionado</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl border border-green-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-700">Ganancias totales</h3>
                          <p className="text-3xl font-bold text-green-600 mt-2">
                            ${stats.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-green-500 p-3 rounded-lg">
                          <FiDollarSign className="text-white text-xl" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">Suma de todas las ventas</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-5 rounded-xl border border-yellow-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-700">Ticket promedio</h3>
                          <p className="text-3xl font-bold text-yellow-600 mt-2">
                            ${stats.averageSale.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="bg-yellow-500 p-3 rounded-lg">
                          <FiTrendingUp className="text-white text-xl" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">Valor promedio por venta</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-700">Tasa de conversión</h3>
                          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.conversionRate}%</p>
                        </div>
                        <div className="bg-purple-500 p-3 rounded-lg">
                          <FiPieChart className="text-white text-xl" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">Ventas vs visitas</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {chartType === 'bar' ? 'Ventas diarias' : 'Tendencia de ventas'}
                      </h3>
                      <div className="h-80">
                        {chartType === 'bar' ? (
                          <Bar data={barChartData} options={barChartOptions} />
                        ) : (
                          <Line data={lineChartData} options={lineChartOptions} />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-8">
                      <div className="bg-gray-50 p-5 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos más vendidos</h3>
                        <div className="h-80">
                          <Pie data={pieChartData} options={pieChartOptions} />
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-5 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por hora del día</h3>
                        <div className="h-64">
                          <Bar data={hourlySalesData} options={hourlyChartOptions} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Productos */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 productos</h3>
                    <div className="space-y-4">
                      {stats.topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                              <span className="font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">{product.name}</h4>
                              <p className="text-sm text-gray-600">Vendidos: {product.quantity} unidades</p>
                            </div>
                          </div>
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            ${(product.quantity * 15).toLocaleString('es-ES')} estimado
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Análisis de productos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-medium text-blue-800">Producto más vendido</h4>
                        <p className="text-xl font-bold mt-2">{stats.topProducts[0]?.name || '-'}</p>
                        <p className="text-blue-600 mt-1">{stats.topProducts[0]?.quantity || 0} unidades</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                        <h4 className="font-medium text-green-800">Ingresos por productos</h4>
                        <p className="text-xl font-bold mt-2">
                          ${(stats.topProducts.reduce((sum, p) => sum + (p.quantity * 15), 0)).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-green-600 mt-1">Estimado</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                        <h4 className="font-medium text-purple-800">Diversificación</h4>
                        <p className="text-xl font-bold mt-2">{stats.topProducts.length} productos</p>
                        <p className="text-purple-600 mt-1">Representan el 80% de ventas</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Detalle de ventas */}
              {activeTab === 'sales' && (
                <div className="space-y-6">
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sales.slice(0, 10).map((sale) => (
                          <tr key={`recent-sale-${sale._id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {format(new Date(sale.timestamp * 1000), 'dd MMM yyyy', { locale: es })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(sale.timestamp * 1000), 'HH:mm', { locale: es })}
                              </div>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              ${(sale.totalAmount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Completado
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de ventas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-gray-700">Venta más grande</h4>
                        <p className="text-2xl font-bold text-blue-600 mt-2">
                          ${Math.max(...sales.map(s => s.totalAmount || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-gray-700">Venta promedio</h4>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          ${(sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0) / sales.length).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-medium text-gray-700">Ventas por día</h4>
                        <p className="text-2xl font-bold text-purple-600 mt-2">
                          {(sales.length / 30).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;