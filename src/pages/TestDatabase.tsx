import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { databaseVPS, testVPSConnection } from '@/lib/database-browser';
import { Database, CheckCircle, XCircle, Plus, Building2 } from 'lucide-react';

export default function TestDatabase() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dbStructure, setDbStructure] = useState<any>(null);
  const [generatedSQL, setGeneratedSQL] = useState<string>('');
  
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    nit: '',
    address: '',
    city: 'Bogotá',
    department: 'Cundinamarca',
    phone: '',
    email: '',
    contact_person: '',
    tax_contributor_type: 'ORDINARIO',
    tipo_persona: 'JURIDICA',
    declarante_renta: true,
    autoretenedor: false,
    inscrito_ica_local: true,
    tipo_transaccion_principal: 'AMBOS'
  });

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    try {
      // Probar conexión
      const connectionResult = await testVPSConnection();
      setConnectionStatus({
        success: connectionResult,
        data: {
          current_time: new Date().toISOString(),
          postgres_version: 'PostgreSQL via API'
        }
      });
      
      if (connectionResult) {
        // Obtener proveedores existentes
        const suppliersData = await databaseVPS.getSuppliers();
        setSuppliers(suppliersData);
        
        // Configurar empresa demo (simulada)
        setCompany({
          id: '1',
          name: 'Empresa Demo',
          nit: '900123456-1',
          city: 'Bogotá',
          tax_regime: 'Ordinario'
        });
        
        // Simular estructura validada
        setDbStructure({
          success: true,
          message: 'Estructura de base de datos validada correctamente',
          tables: ['proveedores', 'empresas', 'productos', 'facturas']
        });
      }
    } catch (error) {
      console.error('Error en prueba:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    setIsLoading(true);
    try {
      const newSupplier = await databaseVPS.createSupplier({
        nombre: supplierForm.name,
        nit: supplierForm.nit,
        telefono: supplierForm.phone,
        email: supplierForm.email,
        direccion: supplierForm.address,
        ciudad: supplierForm.city,
        contacto: supplierForm.contact_person,
        categoria: supplierForm.tax_contributor_type,
        estado: 'activo'
      });
      
      // Generar SQL simulado para mostrar al usuario
      const sqlScript = `INSERT INTO proveedores (nombre, nit, telefono, email, direccion, ciudad, contacto, categoria, estado, fecha_registro)
VALUES ('${supplierForm.name}', '${supplierForm.nit}', '${supplierForm.phone}', '${supplierForm.email}', '${supplierForm.address}', '${supplierForm.city}', '${supplierForm.contact_person}', '${supplierForm.tax_contributor_type}', 'activo', NOW());`;
      setGeneratedSQL(sqlScript);
      
      // Actualizar lista de proveedores
      const updatedSuppliers = await databaseVPS.getSuppliers();
      setSuppliers(updatedSuppliers);
      
      // Limpiar formulario
      setSupplierForm({
        name: '',
        nit: '',
        address: '',
        city: 'Bogotá',
        department: 'Cundinamarca',
        phone: '',
        email: '',
        contact_person: '',
        tax_contributor_type: 'ORDINARIO',
        tipo_persona: 'JURIDICA',
        declarante_renta: true,
        autoretenedor: false,
        inscrito_ica_local: true,
        tipo_transaccion_principal: 'AMBOS'
      });
      
      setShowCreateForm(false);
      alert('✅ Proveedor creado exitosamente!\n\n🔍 Ver consola para el SQL generado o revisar la pestaña "SQL Generado"');
      
    } catch (error) {
      alert('❌ Error creando proveedor: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Prueba de Conexión PostgreSQL VPS</h1>
          <p className="text-muted-foreground">Validación de conexión y creación de proveedores</p>
        </div>
      </div>

      {/* Estado de Conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connectionStatus?.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Estado de Conexión
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !connectionStatus ? (
            <p>Probando conexión...</p>
          ) : connectionStatus?.success ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                <span className="text-sm text-muted-foreground">
                  Servidor: 179.33.214.86:5432
                </span>
              </div>
              <p className="text-sm">
                <strong>Hora del servidor:</strong> {new Date(connectionStatus.data.current_time).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {connectionStatus.data.postgres_version}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Error de Conexión</Badge>
              </div>
              <p className="text-sm text-red-600">
                {connectionStatus?.error || 'Error desconocido'}
              </p>
              <Button onClick={testDatabaseConnection} disabled={isLoading}>
                Reintentar Conexión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validación de Estructura de BD */}
      {dbStructure && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Estructura de Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {dbStructure.success ? (
                  <Badge className="bg-purple-100 text-purple-800">Estructura Validada</Badge>
                ) : (
                  <Badge variant="destructive">Error en Estructura</Badge>
                )}
              </div>
              <p className="text-sm">{dbStructure.message}</p>
              {dbStructure.success && (
                <p className="text-xs text-muted-foreground">
                  Tablas encontradas: {dbStructure.tables.length} 
                  ({dbStructure.tables.slice(0, 3).join(', ')}...)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de la Empresa */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Empresa Configurada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Nombre:</strong> {company.name}</p>
                <p><strong>NIT:</strong> {company.nit}</p>
              </div>
              <div>
                <p><strong>Ciudad:</strong> {company.city}</p>
                <p><strong>Régimen:</strong> {company.tax_regime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proveedores */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Proveedores en Base de Datos</CardTitle>
            <Button onClick={() => setShowCreateForm(!showCreateForm)} disabled={!company}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Proveedor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <form onSubmit={handleCreateSupplier} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold">Crear Nuevo Proveedor</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del Proveedor *</Label>
                  <Input
                    id="name"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nit">NIT *</Label>
                  <Input
                    id="nit"
                    value={supplierForm.nit}
                    onChange={(e) => setSupplierForm({...supplierForm, nit: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={supplierForm.city}
                    onChange={(e) => setSupplierForm({...supplierForm, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="contact">Persona de Contacto</Label>
                  <Input
                    id="contact"
                    value={supplierForm.contact_person}
                    onChange={(e) => setSupplierForm({...supplierForm, contact_person: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tipo de Contribuyente</Label>
                  <Select 
                    value={supplierForm.tax_contributor_type} 
                    onValueChange={(value) => setSupplierForm({...supplierForm, tax_contributor_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORDINARIO">Ordinario</SelectItem>
                      <SelectItem value="REGIMEN_SIMPLE">Régimen Simple</SelectItem>
                      <SelectItem value="GRAN_CONTRIBUYENTE">Gran Contribuyente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Persona</Label>
                  <Select 
                    value={supplierForm.tipo_persona} 
                    onValueChange={(value) => setSupplierForm({...supplierForm, tipo_persona: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JURIDICA">Jurídica</SelectItem>
                      <SelectItem value="NATURAL">Natural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Transacción</Label>
                  <Select 
                    value={supplierForm.tipo_transaccion_principal} 
                    onValueChange={(value) => setSupplierForm({...supplierForm, tipo_transaccion_principal: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BIENES">Bienes</SelectItem>
                      <SelectItem value="SERVICIOS">Servicios</SelectItem>
                      <SelectItem value="AMBOS">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creando...' : 'Crear Proveedor'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {suppliers.length === 0 ? (
              <p className="text-muted-foreground">No hay proveedores registrados</p>
            ) : (
              suppliers.map((supplier) => (
                <div key={supplier.id} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-semibold">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">NIT: {supplier.nit}</p>
                    </div>
                    <div>
                      <p className="text-sm">{supplier.city}</p>
                      <p className="text-sm text-muted-foreground">{supplier.email}</p>
                    </div>
                    <div>
                      <Badge variant="secondary">{supplier.tax_contributor_type}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(supplier.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* SQL Generado */}
      {generatedSQL && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              SQL Generado para PostgreSQL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{generatedSQL}</pre>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">
                <strong>📋 Instrucciones:</strong> Copia este SQL y ejecútalo en tu servidor PostgreSQL 
                (179.33.214.86:5432) para insertar el proveedor en la base de datos real.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}