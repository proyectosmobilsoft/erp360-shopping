// API endpoint para ejecutar SQL en PostgreSQL
// Serverless function que conecta directamente a tu VPS

import { Client } from 'pg';

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  const { sql, host, port, database, user, username, password } = req.body;

  if (!sql) {
    return res.status(400).json({ 
      success: false, 
      error: 'SQL query is required' 
    });
  }

  // Configuración de conexión a PostgreSQL
  const client = new Client({
    host: host || '179.33.214.86',
    port: port || 5432,
    database: database || 'erp_saas_colombiano',
    user: username || user || 'Developer',
    password: password || 'X3c1970213@mam@',
    ssl: false, // VPS local sin SSL
    connectionTimeoutMillis: 10000, // 10 segundos timeout
  });

  try {
    console.log('🔄 Conectando a PostgreSQL:', `${host}:${port}/${database}`);
    
    // Conectar
    await client.connect();
    console.log('✅ Conectado a PostgreSQL exitosamente');

    // Ejecutar SQL
    const result = await client.query(sql);
    console.log('✅ SQL ejecutado, filas afectadas:', result.rowCount);

    // Retornar resultado
    return res.status(200).json({
      success: true,
      data: result.rows,
      rowCount: result.rowCount
    });

  } catch (error) {
    console.error('❌ Error ejecutando SQL:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  } finally {
    // Cerrar conexión
    try {
      await client.end();
      console.log('🔒 Conexión PostgreSQL cerrada');
    } catch (err) {
      console.warn('⚠️ Error cerrando conexión:', err.message);
    }
  }
}