import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePurchasing } from '@/contexts/PurchasingContext';
import { Supplier } from '@/types';
import { 
  documentTypes, 
  calculateNitVerificationDigit,
  formatNit,
  getAllCities 
} from '@/utils/colombianCities';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, FileText, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = usePurchasing();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isTestingDB, setIsTestingDB] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    documentType: 'NIT',
    documentNumber: '',
    verificationDigit: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    cityCode: '',
    cityName: '',
    departmentCode: '',
    departmentName: '',
    contactPerson: '',
    paymentTerms: 30,
    taxContributorType: 'RESPONSABLE_IVA',
    status: true,
    // Nuevos campos para retenciones
    declaranteRenta: true,
    tipoPersona: 'JURIDICA',
    tipoTransaccionPrincipal: 'AMBOS',
    inscritoICALocal: true,
    autoretenedor: false,
    conceptosRetencionAsignados: []
  });
  const [allCities] = useState(() => getAllCities());
  
  const taxContributorTypes = [
    { value: 'RESPONSABLE_IVA', label: 'Responsable de IVA' },
    { value: 'NO_RESPONSABLE_IVA', label: 'No Responsable de IVA' },
    { value: 'REGIMEN_SIMPLE', label: 'Régimen Tributario Simple' }
  ];

  const filteredSuppliers = suppliers.filter(supplier =>
    (supplier.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.nit || supplier.documentNumber || '').includes(searchQuery) ||
    (supplier.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.telefono || supplier.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.ciudad || supplier.cityName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Effect para manejar el cálculo del DV del NIT
  useEffect(() => {
    if (formData.documentType === 'NIT' && formData.documentNumber) {
      const cleanNit = formData.documentNumber.replace(/\D/g, '');
      if (cleanNit.length >= 3) {
        const dv = calculateNitVerificationDigit(cleanNit);
        setFormData(prev => ({ ...prev, verificationDigit: dv }));
      }
    }
  }, [formData.documentNumber, formData.documentType]);

  // Effect para manejar la selección de ciudad (auto-selecciona departamento)
  const handleCityChange = (cityCode: string) => {
    const city = allCities.find(c => c.code === cityCode);
    if (city) {
      setFormData(prev => ({
        ...prev,
        cityCode: city.code,
        cityName: city.name,
        departmentCode: city.departmentCode,
        departmentName: city.departmentName
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.documentNumber || !formData.email || !formData.cityCode) {
      toast({
        title: "Campos obligatorios",
        description: "Nombre, documento, email y ciudad son campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTestingDB(true);
      
      if (editingSupplier) {
        // Actualizar proveedor directamente en PostgreSQL
        const result = await updateSupplier(editingSupplier.id, formData);
        toast({
          title: "✅ Cambios guardados en PostgreSQL",
          description: "La información se actualizó correctamente en tu base de datos.",
        });
      } else {
        // Crear proveedor directamente en PostgreSQL
        const result = await addSupplier(formData as Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>);
        
        // Mostrar modal de confirmación con datos de la BD
        if (result && result.showModal && result.modalData) {
          alert(`🎉 ${result.modalData.title}\n\n${result.modalData.content}\n\nDatos verificados en BD:\n• ID: ${result.modalData.dbConfirmation.id}\n• Nombre: ${result.modalData.dbConfirmation.name}\n• NIT: ${result.modalData.dbConfirmation.nit}\n• Email: ${result.modalData.dbConfirmation.email}\n• Fecha: ${result.modalData.dbConfirmation.created_at}\n\nTotal proveedores en BD: ${result.totalSuppliersInDB}`);
        }
        
        toast({
          title: "✅ PROVEEDOR CREADO Y VERIFICADO EN BD REAL",
          description: `El proveedor "${formData.name}" se guardó exitosamente. Total en BD: ${result?.totalSuppliersInDB || '?'}`,
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: "Ha ocurrido un error al guardar el proveedor: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsTestingDB(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      try {
        await deleteSupplier(id);
        toast({
          title: "✅ Proveedor eliminado de PostgreSQL",
          description: "El proveedor ha sido eliminado correctamente de tu base de datos.",
        });
      } catch (error: any) {
        toast({
          title: "❌ Error eliminando proveedor",
          description: "Ha ocurrido un error al eliminar el proveedor: " + error.message,
          variant: "destructive"
        });
      }
    }
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      documentType: 'NIT',
      documentNumber: '',
      verificationDigit: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      cityCode: '',
      cityName: '',
      departmentCode: '',
      departmentName: '',
      contactPerson: '',
      paymentTerms: 30,
      taxContributorType: 'RESPONSABLE_IVA',
      status: true,
      // Resetear campos de retenciones
      declaranteRenta: true,
      tipoPersona: 'JURIDICA',
      tipoTransaccionPrincipal: 'AMBOS',
      inscritoICALocal: true,
      autoretenedor: false,
      conceptosRetencionAsignados: []
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
          <p className="text-gray-600">Administra la información de tus proveedores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier 
                  ? 'Modifica los datos del proveedor' 
                  : 'Completa la información del nuevo proveedor'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 py-4">
                {/* Row 1: Document Information */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="documentType" className="text-sm font-medium">Tipo Documento *</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value) => setFormData({ ...formData, documentType: value as Supplier['documentType'], verificationDigit: '' })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((doc) => (
                          <SelectItem key={doc.value} value={doc.value}>
                            {doc.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="documentNumber" className="text-sm font-medium">
                      {formData.documentType === 'NIT' ? 'NIT - DV' : 'Número'} *
                    </Label>
                    <div className="flex space-x-1">
                      <Input
                        id="documentNumber"
                        value={formData.documentNumber}
                        onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                        placeholder={formData.documentType === 'NIT' ? "123456789" : "12345678"}
                        className="h-9 flex-1"
                        required
                      />
                      {formData.documentType === 'NIT' && (
                        <Input
                          value={formData.verificationDigit}
                          disabled
                          className="h-9 w-12 bg-gray-50 text-center text-xs"
                          placeholder="DV"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="taxContributorType" className="text-sm font-medium">Tipo de Contribuyente</Label>
                    <Select
                      value={formData.taxContributorType}
                      onValueChange={(value) => setFormData({ ...formData, taxContributorType: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taxContributorTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="status" className="text-sm font-medium">Estado</Label>
                    <div className="flex items-center space-x-2 pt-1">
                      <Switch
                        id="status"
                        checked={formData.status}
                        onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                      />
                      <span className="text-sm text-gray-600">
                        {formData.status ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Razón Social / Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre del proveedor"
                      className="h-9"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Calle 123 #45-67"
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Row 3: Contact Information */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="proveedor@email.com"
                      className="h-9"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="300 123 4567"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="text-sm font-medium">Persona de Contacto</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="Nombre del contacto"
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Row 4: Location and Payment Information */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">Ciudad *</Label>
                    <Select
                      value={formData.cityCode}
                      onValueChange={handleCityChange}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Seleccionar ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCities.map((city) => (
                          <SelectItem key={city.code} value={city.code}>
                            {city.name} - {city.departmentName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">Departamento</Label>
                    <Input
                      id="department"
                      value={formData.departmentName || ''}
                      disabled
                      className="h-9 bg-gray-50"
                      placeholder="Auto-seleccionado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms" className="text-sm font-medium">Términos de Pago (días)</Label>
                    <Input
                      id="paymentTerms"
                      type="number"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 30 })}
                      placeholder="30"
                      className="h-9"
                      min="0"
                    />
                  </div>
                </div>

                {/* Nueva sección: Configuración de Retenciones */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Configuración de Retenciones
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo de Persona</Label>
                      <Select 
                        value={formData.tipoPersona || 'JURIDICA'} 
                        onValueChange={(value: 'NATURAL' | 'JURIDICA') => setFormData({ ...formData, tipoPersona: value })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NATURAL">Persona Natural</SelectItem>
                          <SelectItem value="JURIDICA">Persona Jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo de Transacción Principal</Label>
                      <Select 
                        value={formData.tipoTransaccionPrincipal || 'AMBOS'} 
                        onValueChange={(value: 'BIENES' | 'SERVICIOS' | 'AMBOS') => setFormData({ ...formData, tipoTransaccionPrincipal: value })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BIENES">Bienes</SelectItem>
                          <SelectItem value="SERVICIOS">Servicios</SelectItem>
                          <SelectItem value="AMBOS">Bienes y Servicios</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Declarante de Renta</Label>
                      <Select 
                        value={(formData.declaranteRenta ?? true) ? 'SI' : 'NO'} 
                        onValueChange={(value) => setFormData({ ...formData, declaranteRenta: value === 'SI' })}
                        disabled={formData.taxContributorType === 'REGIMEN_SIMPLE'}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SI">Sí, Declarante</SelectItem>
                          <SelectItem value="NO">No Declarante</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.taxContributorType === 'REGIMEN_SIMPLE' && (
                        <p className="text-xs text-orange-600">⚠️ Régimen Simple: No aplica Retención en la Fuente</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        checked={formData.autoretenedor ?? false}
                        onCheckedChange={(checked) => setFormData({ ...formData, autoretenedor: checked })}
                      />
                      <Label className="text-sm">Es Autoretenedor</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        checked={formData.inscritoICALocal ?? true}
                        onCheckedChange={(checked) => setFormData({ ...formData, inscritoICALocal: checked })}
                      />
                      <Label className="text-sm">Inscrito ICA Local</Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isTestingDB}>
                  {isTestingDB ? 'Guardando...' : (editingSupplier ? 'Actualizar' : 'Crear')} Proveedor
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, NIT o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Total: {filteredSuppliers.length} proveedores</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardDescription>
            Gestiona la información de todos tus proveedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Términos</TableHead>
                <TableHead>Régimen Fiscal</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">
                          {supplier.documentType === 'NIT' 
                            ? formatNit(supplier.documentNumber, supplier.verificationDigit)
                            : `${supplier.documentType} ${supplier.documentNumber}`
                          }
                        </p>
                        <p className="text-xs text-gray-500">{supplier.documentType}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-gray-600">{supplier.contactPerson}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <div>
                        <p className="text-sm">{supplier.cityName}</p>
                        <p className="text-xs text-gray-500">{supplier.departmentName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-3 h-3 mr-1" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {supplier.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.status ? 'default' : 'secondary'}>
                      {supplier.status ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{supplier.paymentTerms} días</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        (supplier.tipoPersona || 'JURIDICA') === 'JURIDICA' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {supplier.tipoPersona || 'JURIDICA'}
                      </span>
                      <br />
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        (supplier.declaranteRenta ?? true) ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {(supplier.declaranteRenta ?? true) ? 'Declarante' : 'No Declarante'}
                      </span>
                      {supplier.taxContributorType === 'REGIMEN_SIMPLE' && (
                        <>
                          <br />
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            Sin Retefuente
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}