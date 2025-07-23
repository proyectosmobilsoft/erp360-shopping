// API endpoint para ejecutar SQL en PostgreSQL
// Express-like endpoint que conecta directamente a tu VPS

import pkg from 'pg';
const { Client } = pkg;

export async function POST(request) {
  try {
    const body = await request.json();
    const { sql, host, port, database, user, username, password } = body;

    if (!sql) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'SQL query is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
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

    console.log('🔄 Conectando a PostgreSQL:', `${host || '179.33.214.86'}:${port || 5432}/${database || 'erp_saas_colombiano'}`);
    
    // Conectar
    await client.connect();
    console.log('✅ Conectado a PostgreSQL exitosamente');

    // Ejecutar SQL
    const result = await client.query(sql);
    console.log('✅ SQL ejecutado, filas afectadas:', result.rowCount);

    // Cerrar conexión
    await client.end();
    console.log('🔒 Conexión PostgreSQL cerrada');

    // Retornar resultado
    return new Response(JSON.stringify({
      success: true,
      data: result.rows,
      rowCount: result.rowCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error ejecutando SQL:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      code: error.code
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}