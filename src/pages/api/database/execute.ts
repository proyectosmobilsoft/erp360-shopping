// API endpoint para ejecutar SQL en PostgreSQL
// Este archivo debe ir en el directorio pages/api/ para Next.js

import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { host, port, database, username, password, sql } = req.body;

  if (!host || !port || !database || !username || !password || !sql) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }

  // Crear conexión a PostgreSQL
  const pool = new Pool({
    host,
    port,
    database,
    user: username,
    password,
    ssl: false, // Cambia a true si tu servidor requiere SSL
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log(`🔄 Conectando a PostgreSQL: ${host}:${port}/${database}`);
    
    // Ejecutar la consulta SQL
    const result = await pool.query(sql);
    
    console.log('✅ SQL ejecutado exitosamente');
    console.log('Filas afectadas:', result.rowCount);
    
    // Cerrar conexión
    await pool.end();
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      rowCount: result.rowCount,
      message: 'SQL ejecutado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error ejecutando SQL:', error);
    
    // Asegurar cierre de conexión en caso de error
    try {
      await pool.end();
    } catch (closeError) {
      console.error('Error cerrando conexión:', closeError);
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error ejecutando SQL en PostgreSQL'
    });
  }
}