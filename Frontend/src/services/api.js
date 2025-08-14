import axios from 'axios';

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

//Productos
// Exporta funciones específicas para productos
export const productAPI = {
  getAll: () => api.get('/api/products'),
  getById: (id) => api.get(`/api/products/${id}`),
  create: (productData) => api.post('/api/products', productData),
  update: (id, productData) => api.put(`/api/products/${id}`, productData),
  delete: (id) => api.delete(`/api/products/${id}`),
  getCategories: () => api.get('/api/product-categories') // Si tienes este endpoint
};

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
export const nodeAPI = {
  getProducts: () => axios.get('http://localhost:3000/api/products'),
  getProductById: (id) => axios.get(`http://localhost:3000/api/products/${id}`)
};

export default api;