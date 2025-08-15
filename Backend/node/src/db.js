const { Pool } = require('pg');

const pool = new Pool({
  user: 'prodcutos', // USUARIO CORRECTO (ver en Render)
  host: 'dpg-d2fqbh2li9vc73e0nrrg-a.oregon-postgres.render.com', // HOST CORRECTO
  database: 'productos_k3yz',
  password: 'tedYpBMxiOuKp3ulTn2LEMzUWMlvFTwf',
  port: 5432,
  ssl: {
    rejectUnauthorized: false // NECESARIO PARA RENDER
  },
  connectionTimeoutMillis: 5000, // Timeout de conexión
  idleTimeoutMillis: 30000,      // Cerrar conexiones inactivas
});

// Verificador de conexión mejorado
pool.on('connect', (client) => {
  console.log('✅ Conexión a PostgreSQL establecida');
  client.query('SELECT NOW()', (err) => {
    if (err) console.error('❌ Error en ping inicial:', err);
    else console.log('✔ Ping a PostgreSQL exitoso');
  });
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en la conexión:', err);
  // Aquí podrías agregar lógica de reconexión
});

// Función para probar la conexión al iniciar
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✔ Prueba de conexión exitosa. Hora del servidor:', res.rows[0].now);
  } catch (err) {
    console.error('❌ FALLA EN CONEXIÓN A POSTGRESQL:', err);
    process.exit(1); // Salir si no hay conexión
  }
}

testConnection();

module.exports = pool;