// Mock database implementation for browser compatibility
export interface Supplier {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  contacto: string;
  categoria: string;
  estado: 'activo' | 'inactivo';
  fecha_registro: string;
}

// Mock data storage
let mockSuppliers: Supplier[] = [
  {
    id: '1',
    nombre: 'Proveedor Ejemplo 1',
    nit: '12345678-9',
    telefono: '555-0101',
    email: 'proveedor1@ejemplo.com',
    direccion: 'Calle 123 #45-67',
    ciudad: 'Bogotá',
    contacto: 'Juan Pérez',
    categoria: 'Materiales',
    estado: 'activo',
    fecha_registro: new Date().toISOString()
  },
  {
    id: '2',
    nombre: 'Proveedor Ejemplo 2',
    nit: '87654321-0',
    telefono: '555-0102',
    email: 'proveedor2@ejemplo.com',
    direccion: 'Carrera 89 #12-34',
    ciudad: 'Medellín',
    contacto: 'María García',
    categoria: 'Servicios',
    estado: 'activo',
    fecha_registro: new Date().toISOString()
  }
];

export const mockDatabase = {
  async getSuppliers(): Promise<Supplier[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockSuppliers];
  },

  async createSupplier(supplier: Omit<Supplier, 'id' | 'fecha_registro'>): Promise<Supplier> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newSupplier: Supplier = {
      ...supplier,
      id: Date.now().toString(),
      fecha_registro: new Date().toISOString()
    };
    
    mockSuppliers.push(newSupplier);
    return newSupplier;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const index = mockSuppliers.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    mockSuppliers[index] = { ...mockSuppliers[index], ...updates };
    return mockSuppliers[index];
  },

  async deleteSupplier(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const index = mockSuppliers.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    mockSuppliers.splice(index, 1);
    return true;
  }
};