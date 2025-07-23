import { Pool } from 'pg';

// Configuración del pool de conexiones PostgreSQL
const pool = new Pool({
  host: '179.33.214.86',
  port: 5432,
  user: 'Developer',
  password: 'X3c1970213@mam@',
  database: 'erp_saas_colombiano',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Función para ejecutar queries directamente
export const executeQuery = async (query: string, params: any[] = []) => {
  try {
    const client = await pool.connect();
    const result = await client.query(query, params);
    client.release();
    console.log('✅ Query ejecutado exitosamente:', query.substring(0, 50));
    return { success: true, data: result.rows, rowCount: result.rowCount };
  } catch (error) {
    console.error('❌ Error ejecutando query:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Funciones específicas para proveedores
export const getSuppliersFromDB = async () => {
  const companyId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  
  const query = `
    SELECT 
      s.id::text,
      s.nit as "documentNumber",
      CASE 
        WHEN s.nit ~ '^[0-9]+$' THEN 'NIT'
        ELSE 'CC'
      END as "documentType",
      '' as "verificationDigit",
      s.name,
      s.email,
      s.phone,
      s.address,
      '' as "cityCode",
      s.city as "cityName", 
      '' as "departmentCode",
      s.department as "departmentName",
      s.contact_person as "contactPerson",
      30 as "paymentTerms",
      CASE 
        WHEN s.tax_contributor_type = 'REGIMEN_SIMPLE' THEN 'REGIMEN_SIMPLE'
        ELSE 'RESPONSABLE_IVA'
      END as "taxContributorType",
      s.is_active as status,
      s.tipo_persona as "tipoPersona",
      s.declarante_renta as "declaranteRenta",
      s.autoretenedor,
      s.inscrito_ica_local as "inscritoICALocal",
      s.tipo_transaccion_principal as "tipoTransaccionPrincipal",
      s.created_at as "createdAt",
      s.updated_at as "updatedAt"
    FROM suppliers s
    WHERE s.company_id = $1 AND s.is_active = true
    ORDER BY s.created_at DESC;
  `;
  
  return await executeQuery(query, [companyId]);
};

export const createSupplierInDB = async (supplierData: any) => {
  const companyId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  
  // Primero crear la empresa si no existe
  await executeQuery(`
    INSERT INTO companies (
      id, name, nit, address, city, department, phone, email, tax_regime, is_active, created_at, updated_at
    ) VALUES (
      $1, 'MI EMPRESA DE PRUEBA SAS', '900123456-1', 'Calle 123 #45-67',
      'Bogotá', 'Cundinamarca', '601234567', 'admin@miempresa.com', 'ORDINARIO', true, NOW(), NOW()
    ) ON CONFLICT (id) DO NOTHING;
  `, [companyId]);

  // Insertar proveedor
  const query = `
    INSERT INTO suppliers (
      company_id, name, nit, address, city, department, phone, email, 
      contact_person, tax_contributor_type, tipo_persona, declarante_renta, 
      autoretenedor, inscrito_ica_local, tipo_transaccion_principal, 
      is_active, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, NOW(), NOW()
    ) RETURNING id, name, nit, email, created_at;
  `;

  return await executeQuery(query, [
    companyId,
    supplierData.name,
    supplierData.documentNumber,
    supplierData.address || '',
    supplierData.cityName || 'Bogotá',
    supplierData.departmentName || 'Cundinamarca',
    supplierData.phone || '',
    supplierData.email,
    supplierData.contactPerson || '',
    supplierData.taxContributorType === 'REGIMEN_SIMPLE' ? 'REGIMEN_SIMPLE' : 'ORDINARIO',
    supplierData.tipoPersona || 'JURIDICA',
    supplierData.declaranteRenta ?? true,
    supplierData.autoretenedor ?? false,
    supplierData.inscritoICALocal ?? true,
    supplierData.tipoTransaccionPrincipal || 'AMBOS'
  ]);
};

export const updateSupplierInDB = async (id: string, supplierData: any) => {
  const query = `
    UPDATE suppliers 
    SET 
      name = $1,
      email = $2,
      phone = $3,
      address = $4,
      city = $5,
      department = $6,
      contact_person = $7,
      tax_contributor_type = $8,
      tipo_persona = $9,
      declarante_renta = $10,
      autoretenedor = $11,
      inscrito_ica_local = $12,
      tipo_transaccion_principal = $13,
      updated_at = NOW()
    WHERE id::text = $14
    RETURNING id;
  `;

  return await executeQuery(query, [
    supplierData.name,
    supplierData.email,
    supplierData.phone || '',
    supplierData.address || '',
    supplierData.cityName || 'Bogotá',
    supplierData.departmentName || 'Cundinamarca',
    supplierData.contactPerson || '',
    supplierData.taxContributorType === 'REGIMEN_SIMPLE' ? 'REGIMEN_SIMPLE' : 'ORDINARIO',
    supplierData.tipoPersona || 'JURIDICA',
    supplierData.declaranteRenta ?? true,
    supplierData.autoretenedor ?? false,
    supplierData.inscritoICALocal ?? true,
    supplierData.tipoTransaccionPrincipal || 'AMBOS',
    id
  ]);
};

export const deleteSupplierInDB = async (id: string) => {
  const query = `
    UPDATE suppliers 
    SET is_active = false, updated_at = NOW()
    WHERE id::text = $1
    RETURNING id;
  `;
  
  return await executeQuery(query, [id]);
};

export const testConnection = async () => {
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
};