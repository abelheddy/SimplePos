const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Configuración de CORS (debe ir al inicio)
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'], // frontend y backend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));


// Middleware para parsear JSON
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Node funcionando');
});

// Rutas de productos
const productRoutes = require('./routes/product.routes'); // Asegúrate que la ruta sea correcta
app.use('/api/products', productRoutes);

// Rutas de Marcas
const brandRoutes = require('./routes/brand.routes');
app.use('/api/brands', brandRoutes);

//Rutas de Tax
const taxRoutes = require('./routes/tax.routes');
app.use('/api/taxes', taxRoutes);

// Rutas para Inventario
const inventoryRoutes = require('./routes/inventory.routes');
app.use('/api/inventory', inventoryRoutes);

// Iniciar servidor (solo una vez)
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});