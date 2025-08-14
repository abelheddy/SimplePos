const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',      // Usuario fijo (ya que funciona)
  host: 'localhost',
  database: 'Productos',
  password: 'root',      // Contraseña fija
  port: 5432,
});

// Verificador de conexión
pool.on('connect', () => console.log('✅ Conexión a PostgreSQL establecida'));
pool.on('error', (err) => console.error('❌ Error en la conexión:', err));

module.exports = pool;