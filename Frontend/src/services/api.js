/*import axios from 'axios';

const API_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Eliminar token inválido
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('email');

      // Redirigir a login con mensaje
      if (typeof window !== 'undefined') {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

// En tu archivo api.js, añade esto al final
export const salesAPI = {
  create: async (saleData) => {
    try {
      const response = await api.post('/sales', saleData);
      console.log('Venta creada:', response.data); // Para depuración
      return response.data;
    } catch (error) {
      console.error('Error al crear venta:', error.response?.data || error.message);
      throw error;
    }
  },
  getAll: () => api.get('/sales'),
  getById: (id) => api.get(`/sales/${id}`),
  update: (id, saleData) => api.put(`/sales/${id}`, saleData),
  delete: (id) => api.delete(`/sales/${id}`),
  getReport: (startDate, endDate) => api.get('/reports/sales', {
    params: { start: startDate, end: endDate }
  })
};



// src/services/api.js (añadir esto al final)
// servidor de node.js
//esto es para obtener productos para lapagina de ventas
export const nodeAPI = {
  getProducts: () => axios.get('http://localhost:3000/api/products'),
  getProductById: (id) => axios.get(`http://localhost:3000/api/products/${id}`)
};

export default api;*/

// src/services/api.js
// src/services/api.js
import axios from 'axios';

// URLs base para los diferentes backends
const GO_API_URL = 'http://localhost:8080';
const NODE_API_URL = 'http://localhost:3000/api';

// Instancia para el backend de Go (ventas)
const goApi = axios.create({
  baseURL: GO_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Instancia para el backend de Node (productos, marcas, inventario)
const nodeApi = axios.create({
  baseURL: NODE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor común para añadir token a las peticiones
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Interceptor para manejar errores 401 (no autorizado)
const handleUnauthorized = (error) => {
  if (error.response?.status === 401) {
    // Eliminar token inválido y otros datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');

    // Redirigir a login con mensaje (solo en entorno cliente)
    if (typeof window !== 'undefined') {
      window.location.href = '/login?session=expired';
    }
  }
  return Promise.reject(error);
};

// Aplicar interceptores a la instancia de Go
goApi.interceptors.request.use(addAuthToken);
goApi.interceptors.response.use(
  response => response,
  handleUnauthorized
);

// Aplicar interceptores a la instancia de Node
nodeApi.interceptors.request.use(addAuthToken);
nodeApi.interceptors.response.use(
  response => response,
  handleUnauthorized
);

// API para ventas (backend Go)
export const salesAPI = {
  create: (saleData) => goApi.post('/sales', saleData),
  getAll: () => goApi.get('/sales'),
  getById: (id) => goApi.get(`/sales/${id}`),
  update: (id, saleData) => goApi.put(`/sales/${id}`, saleData),
  delete: (id) => goApi.delete(`/sales/${id}`),
  getReport: (startDate, endDate) => goApi.get('/reports/sales', {
    params: { start: startDate, end: endDate }
  })
};

// API para productos y marcas (backend Node)
export const nodeAPI = {
  // Recursos para marcas
  brands: {
    getAll: () => nodeApi.get('/brands'),
    create: (brandData) => nodeApi.post('/brands', brandData),
    update: (id, brandData) => nodeApi.put(`/brands/${id}`, brandData),
    delete: (id) => nodeApi.delete(`/brands/${id}`),
    getById: (id) => nodeApi.get(`/brands/${id}`)
  },

  // Recursos para productos
  products: {
    getAll: () => nodeApi.get('/products'),
    getById: (id) => nodeApi.get(`/products/${id}`),
    create: (productData) => nodeApi.post('/products', productData),
    update: (id, productData) => nodeApi.put(`/products/${id}`, productData),
    delete: (id) => nodeApi.delete(`/products/${id}`)
  },

  // Nuevo: Recursos para impuestos (IVA)
  taxes: {
    getAll: () => nodeApi.get('/taxes'),
    getById: (id) => nodeApi.get(`/taxes/${id}`),
    create: (taxData) => nodeApi.post('/taxes', taxData),
    update: (id, taxData) => nodeApi.put(`/taxes/${id}`, taxData),
    delete: (id) => nodeApi.delete(`/taxes/${id}`)
  },

  // Nuevo: Recursos para inventario
  inventory: {
    create: (inventoryData) => nodeApi.post('/inventory', inventoryData),
    update: (id, inventoryData) => nodeApi.put(`/inventory/${id}`, inventoryData),
    getByProduct: (productId) => nodeApi.get(`/inventory/product/${productId}`),
    getAll: () => nodeApi.get('/inventory'),
    getById: (id) => nodeApi.get(`/inventory/${id}`),
    delete: (id) => nodeApi.delete(`/inventory/${id}`),
    decrement: (productId, quantity) =>
      nodeApi.put(`/inventory/decrement/${productId}`, { quantity })
  },

  // Alias para compatibilidad
  getProducts: () => nodeApi.get('/products'),
  getProductById: (id) => nodeApi.get(`/products/${id}`)
};

export const userAPI = {
  getProfile: (token) => goApi.get('/profile', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }),
  updateProfile: (userData, token) => goApi.put('/profile', userData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
};
// Exportar las instancias de Axios por si se necesitan directamente
export { goApi, nodeApi };

// Exportar instancia principal
const api = goApi;
export default api;
export const activityAPI = {
  getRecent: () => goApi.get('/admin/activity')
};

export const salesTrendAPI = {
  getSalesTrend: () => goApi.get('/admin/sales-trend')
};

export const metricsAPI = {
  /**
   * Obtiene las métricas para el dashboard de administración
   * @returns {Promise} Promesa con las métricas
   */
  getDashboardMetrics: () => goApi.get('/admin/metrics')
};