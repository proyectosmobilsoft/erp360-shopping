// Script para crear datos de prueba y guardarlos en PostgreSQL
import pkg from 'pg';
const { Client } = pkg;

const mockSuppliers = [
  {
    name: 'MOBILSOFT SAS',
    documentNumber: '900123456',
    documentType: 'NIT',
    email: 'contacto@mobilsoft.com.co',
    phone: '601234567',
    address: 'Carrera 15 #93-47 Oficina 501',
    cityName: 'Bogotá',
    departmentName: 'Cundinamarca',
    contactPerson: 'Carlos Rodríguez',
    taxContributorType: 'RESPONSABLE_IVA',
    tipoPersona: 'JURIDICA',
    declaranteRenta: true,
    autoretenedor: false,
    inscritoICALocal: true,
    tipoTransaccionPrincipal: 'SERVICIOS'
  },
  {
    name: 'TECNOLOGÍA Y SISTEMAS LTDA',
    documentNumber: '800987654',
    documentType: 'NIT',
    email: 'ventas@tecnosistemas.co',
    phone: '6045551234',
    address: 'Calle 10 #5-25',
    cityName: 'Medellín',
    departmentName: 'Antioquia',
    contactPerson: 'Ana García',
    taxContributorType: 'RESPONSABLE_IVA',
    tipoPersona: 'JURIDICA',
    declaranteRenta: true,
    autoretenedor: true,
    inscritoICALocal: true,
    tipoTransaccionPrincipal: 'BIENES'
  },
  {
    name: 'DISTRIBUIDORA EL ÉXITO SA',
    documentNumber: '890123789',
    documentType: 'NIT',
    email: 'proveedores@exito.com.co',
    phone: '6015551111',
    address: 'Autopista Norte Km 12',
    cityName: 'Bogotá',
    departmentName: 'Cundinamarca',
    contactPerson: 'María López',
    taxContributorType: 'RESPONSABLE_IVA',
    tipoPersona: 'JURIDICA',
    declaranteRenta: true,
    autoretenedor: false,
    inscritoICALocal: true,
    tipoTransaccionPrincipal: 'AMBOS'
  },
  {
    name: 'FERRETERÍA EL MARTILLO',
    documentNumber: '79456123',
    documentType: 'CC',
    email: 'elmartillo@hotmail.com',
    phone: '3001234567',
    address: 'Calle 45 #12-34',
    cityName: 'Cali',
    departmentName: 'Valle del Cauca',
    contactPerson: 'Pedro Martínez',
    taxContributorType: 'REGIMEN_SIMPLE',
    tipoPersona: 'NATURAL',
    declaranteRenta: false,
    autoretenedor: false,
    inscritoICALocal: false,
    tipoTransaccionPrincipal: 'BIENES'
  },
  {
    name: 'CONSULTORÍA EMPRESARIAL SAS',
    documentNumber: '901234567',
    documentType: 'NIT',
    email: 'info@consultoriaempresarial.co',
    phone: '6072345678',
    address: 'Carrera 70 #52A-22',
    cityName: 'Barranquilla',
    departmentName: 'Atlántico',
    contactPerson: 'Luis Fernández',
    taxContributorType: 'RESPONSABLE_IVA',
    tipoPersona: 'JURIDICA',
    declaranteRenta: true,
    autoretenedor: false,
    inscritoICALocal: true,
    tipoTransaccionPrincipal: 'SERVICIOS'
  }
];

async function insertMockData() {
  const client = new Client({
    host: '179.33.214.86',
    port: 5432,
    database: 'erp_saas_colombiano',
    user: 'Developer',
    password: 'X3c1970213@mam@',
    ssl: false,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔄 Conectando a PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado exitosamente');

    // Crear empresa de prueba
    const companyId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    
    console.log('🏢 Creando empresa de prueba...');
    await client.query(`
      INSERT INTO companies (
        id, name, nit, address, city, department, phone, email, tax_regime, created_at, updated_at
      ) VALUES (
        $1, 'MI EMPRESA DE PRUEBA SAS', '900123456-1', 'Calle 123 #45-67', 
        'Bogotá', 'Cundinamarca', '601234567', 'admin@miempresa.com', 
        'ORDINARIO', NOW(), NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `, [companyId]);

    console.log('👥 Insertando proveedores de prueba...');
    
    for (let i = 0; i < mockSuppliers.length; i++) {
      const supplier = mockSuppliers[i];
      
      try {
        const result = await client.query(`
          INSERT INTO suppliers (
            id, company_id, name, nit, address, city, department, phone, email, 
            contact_person, tax_contributor_type, tipo_persona, declarante_renta, 
            autoretenedor, inscrito_ica_local, tipo_transaccion_principal, 
            status, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, NOW(), NOW()
          ) RETURNING id, name;
        `, [
          companyId,
          supplier.name,
          supplier.documentNumber,
          supplier.address,
          supplier.cityName,
          supplier.departmentName,
          supplier.phone,
          supplier.email,
          supplier.contactPerson,
          supplier.taxContributorType === 'REGIMEN_SIMPLE' ? 'REGIMEN_SIMPLE' : 'ORDINARIO',
          supplier.tipoPersona,
          supplier.declaranteRenta,
          supplier.autoretenedor,
          supplier.inscritoICALocal,
          supplier.tipoTransaccionPrincipal
        ]);
        
        console.log(`✅ ${i + 1}. ${result.rows[0].name} - ID: ${result.rows[0].id}`);
      } catch (error) {
        console.error(`❌ Error insertando ${supplier.name}:`, error.message);
      }
    }

    // Verificar datos insertados
    console.log('\n📊 Verificando datos insertados...');
    const result = await client.query(`
      SELECT id, name, nit, email, city, tipo_persona, tax_contributor_type 
      FROM suppliers 
      WHERE status = true 
      ORDER BY created_at DESC;
    `);
    
    console.log(`\n✅ TOTAL PROVEEDORES EN BASE DE DATOS: ${result.rows.length}`);
    console.log('📋 Lista de proveedores:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name} (${row.nit}) - ${row.email} - ${row.city}`);
    });

    await client.end();
    console.log('\n🎉 ¡Datos de prueba insertados exitosamente!');
    console.log('🌐 Ahora ve a http://localhost:5174/suppliers para ver los proveedores');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

insertMockData();