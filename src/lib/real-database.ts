// Conexión directa a PostgreSQL en tu VPS
// IP: 179.33.214.86:5432
// Base de datos: erp_colombia

interface DatabaseResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

export async function executeSQL(sql: string): Promise<DatabaseResponse> {
  try {
    console.log('🔄 Ejecutando SQL en PostgreSQL:', sql.substring(0, 100) + '...');
    
    const response = await fetch('http://localhost:3001/api/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sql,
        host: '179.33.214.86',
        port: 5432,
        database: 'erp_saas_colombiano',
        username: 'Developer',
        password: 'X3c1970213@mam@'
      })
    });

    if (!response.ok) {
      console.error(`Error HTTP ${response.status}: ${response.statusText}`);
      return { 
        success: false, 
        error: `Error de conexión: HTTP ${response.status}` 
      };
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ SQL ejecutado exitosamente');
      return { success: true, data: result.data || [] };
    } else {
      console.error('❌ Error ejecutando SQL:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error('❌ Error de conexión a PostgreSQL:', error);
    return { 
      success: false, 
      error: `Error de conexión: ${error.message}` 
    };
  }
}