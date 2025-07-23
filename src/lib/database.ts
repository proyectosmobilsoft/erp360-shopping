import { Pool } from 'pg';

const pool = new Pool({
  host: '179.33.214.86',  
  port: 5432,
  user: 'Developer',
  password: 'X3c1970213@mam@',
  database: 'erp_saas_colombiano',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Función para probar la conexión
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    client.release();
    console.log('✅ Conexión exitosa a PostgreSQL VPS');
    console.log('Hora del servidor:', result.rows[0].current_time);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return { success: false, error: error.message };
  }
}

// Función para obtener la empresa demo
export async function getCompanyDemo() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM companies WHERE nit = $1', ['900123456-1']);
    client.release();
    return result.rows[0];
  } catch (error) {
    console.error('Error obteniendo empresa demo:', error);
    throw error;
  }
}

// Función para crear un proveedor
export async function createSupplier(supplierData: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const insertQuery = `
      INSERT INTO suppliers (
        company_id, name, nit, address, city, department, phone, email, 
        contact_person, tax_contributor_type, tipo_persona, declarante_renta,
        autoretenedor, inscrito_ica_local, tipo_transaccion_principal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const values = [
      supplierData.company_id,
      supplierData.name,
      supplierData.nit,
      supplierData.address,
      supplierData.city,
      supplierData.department,
      supplierData.phone,
      supplierData.email,
      supplierData.contact_person,
      supplierData.tax_contributor_type,
      supplierData.tipo_persona,
      supplierData.declarante_renta,
      supplierData.autoretenedor,
      supplierData.inscrito_ica_local,
      supplierData.tipo_transaccion_principal
    ];
    
    const result = await client.query(insertQuery, values);
    await client.query('COMMIT');
    
    console.log('✅ Proveedor creado exitosamente:', result.rows[0]);
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando proveedor:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Función para listar proveedores
export async function getSuppliers(companyId: string) {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM suppliers WHERE company_id = $1 ORDER BY created_at DESC', 
      [companyId]
    );
    client.release();
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    throw error;
  }
}

export { pool };