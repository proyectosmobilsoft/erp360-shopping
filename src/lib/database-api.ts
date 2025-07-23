export interface Supplier {
  id: string;
  nombre: string;
  nit: string;
  telefono?: string;
  email: string;
  direccion?: string;
  ciudad?: string;
  contacto?: string;
  categoria?: string;
  estado: 'activo' | 'inactivo';
  fecha_registro: string;
}

export const supplierAPI = {
  // Listar todos los proveedores
  async getSuppliers(): Promise<Supplier[]> {
    try {
      console.log('🔄 Obteniendo proveedores desde API...');
      const response = await fetch('/api/suppliers');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error obteniendo proveedores');
      }
      
      console.log('✅ Proveedores obtenidos desde API:', result.data.length);
      return result.data;
    } catch (error) {
      console.error('❌ Error obteniendo proveedores:', error);
      throw error;
    }
  },

  // Crear nuevo proveedor
  async createSupplier(supplierData: Omit<Supplier, 'id' | 'fecha_registro'>): Promise<Supplier> {
    try {
      console.log('🔄 Creando proveedor via API...', supplierData);
      
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error creando proveedor');
      }
      
      console.log('✅ Proveedor creado via API:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error creando proveedor:', error);
      throw error;
    }
  },

  // Actualizar proveedor
  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier | null> {
    try {
      console.log('🔄 Actualizando proveedor via API...', id, supplierData);
      
      const response = await fetch('/api/suppliers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...supplierData }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(result.error || 'Error actualizando proveedor');
      }
      
      console.log('✅ Proveedor actualizado via API:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error actualizando proveedor:', error);
      throw error;
    }
  },

  // Eliminar proveedor
  async deleteSupplier(id: string): Promise<boolean> {
    try {
      console.log('🔄 Eliminando proveedor via API...', id);
      
      const response = await fetch(`/api/suppliers?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!result.success) {
        if (response.status === 404) {
          return false;
        }
        throw new Error(result.error || 'Error eliminando proveedor');
      }
      
      console.log('✅ Proveedor eliminado via API');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando proveedor:', error);
      throw error;
    }
  },

  // Test de conexión
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔄 Probando conexión API...');
      const response = await fetch('/api/suppliers');
      const result = await response.json();
      console.log('✅ Conexión API exitosa');
      return result.success;
    } catch (error) {
      console.error('❌ Error conectando a API:', error);
      return false;
    }
  }
};