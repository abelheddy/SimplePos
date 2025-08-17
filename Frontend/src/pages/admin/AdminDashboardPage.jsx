import React, { useState, useEffect } from 'react';
import { 
  metricsAPI, 
  activityAPI, 
  salesTrendAPI 
} from '../../services/api';
import { 
  FaUsers, 
  FaDollarSign, 
  FaBoxOpen, 
  FaChartLine,
  FaShoppingCart,
  FaUserPlus,
  FaUserEdit,
  FaUserTimes,
  FaSignInAlt,
  FaSync
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';

const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState({
    users: 0,
    sales: 0,
    products: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [salesTrend, setSalesTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Configuración de gráficos
  const chartOptions = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#6366F1'],
    xaxis: {
      categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    },
    tooltip: { 
      theme: 'light',
      y: {
        formatter: (value) => `$${value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
      }
    },
    yaxis: {
      labels: {
        formatter: (value) => `$${value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
      }
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Obtener métricas principales
      const metricsResponse = await metricsAPI.getDashboardMetrics();
      setMetrics({
        users: metricsResponse.data.users || 0,
        sales: metricsResponse.data.sales || 0,
        products: metricsResponse.data.products || 0
      });
      
      // Obtener tendencia de ventas
      const trendResponse = await salesTrendAPI.getSalesTrend();
      setSalesTrend(trendResponse.data || []);
      
      // Obtener actividad reciente
      const activityResponse = await activityAPI.getRecent();
      setRecentActivity(activityResponse.data || []);
      
      setLastUpdated(new Date().toLocaleTimeString());
      setError('');
    } catch (err) {
      setError('Error al cargar datos: ' + (err.message || 'Servidor no disponible'));
      console.error('Error en dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchAllData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Componente de tarjeta de métricas
  const MetricCard = ({ title, value, icon, color, isCurrency = false }) => (
    <motion.div 
      className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color} transition-all hover:shadow-xl`}
      whileHover={{ y: -5 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
          <p className="text-3xl font-bold mt-2">
            {isCurrency ? formatMoney(value) : value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('border-l-', 'bg-')} text-white`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  // Función para formatear dinero
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función para obtener ícono de actividad
  const getActivityIcon = (type) => {
    switch(type) {
      case 'login': return <FaSignInAlt className="text-blue-500" />;
      case 'new_sale': return <FaShoppingCart className="text-green-500" />;
      case 'new_user': return <FaUserPlus className="text-purple-500" />;
      case 'update_user': return <FaUserEdit className="text-yellow-500" />;
      case 'delete_user': return <FaUserTimes className="text-red-500" />;
      default: return <FaChartLine className="text-gray-500" />;
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    const options = { 
      hour: '2-digit', 
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    };
    return new Date(dateString).toLocaleString('es-MX', options);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-lg text-gray-600">Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 rounded-xl shadow-lg">
        <div className="text-red-700 font-medium text-lg mb-4">Error en el dashboard</div>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={fetchAllData}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center"
        >
          <FaSync className="mr-2" /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-gray-600 mt-2">
            Resumen completo del sistema - Datos en tiempo real
          </p>
        </div>
        <div className="flex items-center mt-4 md:mt-0">
          <span className="text-sm text-gray-500 mr-3">
            Actualizado: {lastUpdated}
          </span>
          <button 
            onClick={fetchAllData}
            className="bg-white p-2 rounded-full shadow text-gray-500 hover:text-purple-600 hover:bg-gray-50 transition"
          >
            <FaSync className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Usuarios registrados"
          value={metrics.users}
          icon={<FaUsers className="text-xl" />}
          color="border-l-blue-500"
        />
        
        <MetricCard
          title="Ventas hoy"
          value={metrics.sales}
          icon={<FaDollarSign className="text-xl" />}
          color="border-l-green-500"
          isCurrency={true}
        />
        
        <MetricCard
          title="Productos en stock"
          value={metrics.products}
          icon={<FaBoxOpen className="text-xl" />}
          color="border-l-purple-500"
        />
      </div>

      {/* Gráficos y Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de ventas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Tendencia de Ventas (7 días)</h2>
          </div>
          
          {salesTrend.length > 0 ? (
            <Chart
              options={chartOptions}
              series={[{ name: 'Ventas', data: salesTrend }]}
              type="line"
              height={300}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay datos de ventas disponibles
            </div>
          )}
        </div>
        
        {/* Actividad reciente */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Actividad Reciente</h2>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {recentActivity.map((activity) => (
                <div 
                  key={activity._id} 
                  className="flex items-start border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-800">{activity.user_email}</span>
                      <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
                    </div>
                    <p className="text-gray-600">{activity.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay actividad reciente
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas 
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Estadísticas Clave</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="Conversión" 
            value="4.5%" 
            change="+2.1%" 
            positive 
          />
          <StatCard 
            title="Clientes nuevos" 
            value="24" 
            change="+5" 
            positive 
          />
          <StatCard 
            title="Pedidos promedio" 
            value={formatMoney(2450)} 
            change="+12%" 
            positive 
          />
          <StatCard 
            title="Satisfacción" 
            value="92%" 
            change="+4%" 
            positive 
          />
        </div>
      </div>*/}
    </div>
  );
};

// Componente para tarjetas de estadísticas
const StatCard = ({ title, value, change, positive = false }) => (
  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
    <p className="text-sm text-gray-500 mb-1">{title}</p>
    <div className="flex items-baseline justify-between">
      <span className="text-2xl font-bold">{value}</span>
      <span className={`text-sm ${positive ? 'text-green-500' : 'text-red-500'}`}>
        {change}
      </span>
    </div>
  </div>
);

export default AdminDashboardPage;