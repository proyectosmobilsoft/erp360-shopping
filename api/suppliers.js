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

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Listar proveedores
      const result = await pool.query(`
        SELECT id, nombre, nit, telefono, email, direccion, ciudad, 
               contacto, categoria, estado, fecha_registro
        FROM proveedores 
        ORDER BY fecha_registro DESC
      `);
      
      return res.status(200).json({ success: true, data: result.rows });
    }
    
    if (req.method === 'POST') {
      // Crear proveedor
      const { nombre, nit, telefono, email, direccion, ciudad, contacto, categoria, estado } = req.body;
      
      const result = await pool.query(`
        INSERT INTO proveedores (nombre, nit, telefono, email, direccion, ciudad, contacto, categoria, estado, fecha_registro)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id, nombre, nit, telefono, email, direccion, ciudad, contacto, categoria, estado, fecha_registro
      `, [nombre, nit, telefono, email, direccion, ciudad, contacto, categoria, estado || 'activo']);

      return res.status(201).json({ success: true, data: result.rows[0] });
    }
    
    if (req.method === 'PUT') {
      // Actualizar proveedor
      const { id, ...updateData } = req.body;
      
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${paramCount++}`);
          values.push(updateData[key]);
        }
      });

      values.push(id);

      const result = await pool.query(`
        UPDATE proveedores 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, nombre, nit, telefono, email, direccion, ciudad, contacto, categoria, estado, fecha_registro
      `, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
      }

      return res.status(200).json({ success: true, data: result.rows[0] });
    }
    
    if (req.method === 'DELETE') {
      // Eliminar proveedor
      const { id } = req.query;
      
      const result = await pool.query(`
        DELETE FROM proveedores 
        WHERE id = $1
        RETURNING id
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
      }

      return res.status(200).json({ success: true, message: 'Proveedor eliminado' });
    }
    
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API suppliers:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}