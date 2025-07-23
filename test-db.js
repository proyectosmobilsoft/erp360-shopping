const pkg = require('pg');
const { Client } = pkg;

async function testConnection() {
  const client = new Client({
    host: 'postgresql-3.cxozgbtflrpv.us-east-1.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'compras'
  });
  
  try {
    await client.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Verificar tabla suppliers
    const result = await client.query('SELECT COUNT(*) FROM suppliers');
    console.log('✅ Registros en suppliers:', result.rows[0].count);
    
    // Probar inserción directa
    const testInsert = await client.query(`
      INSERT INTO suppliers (
        id, company_id, name, nit, email, status, created_at, updated_at,
        city, department, tipo_persona, declarante_renta
      ) VALUES (
        gen_random_uuid(),
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Test Supplier Direct',
        '123456789',
        'test@test.com',
        true,
        NOW(),
        NOW(),
        'Bogotá',
        'Cundinamarca',
        'JURIDICA',
        true
      ) RETURNING id;
    `);
    
    console.log('✅ Inserción directa exitosa:', testInsert.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();
