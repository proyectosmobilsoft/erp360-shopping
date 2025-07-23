import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Edit, ShoppingCart, Wrench, Plus } from 'lucide-react';
import { Supplier, RetentionConcept, TaxRegime } from '@/types/retention';

interface SupplierRetentionConfigProps {
  onSuppliersUpdated?: () => void;
}

const SupplierRetentionConfig: React.FC<SupplierRetentionConfigProps> = ({ onSuppliersUpdated }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [concepts, setConcepts] = useState<RetentionConcept[]>([]);
  const [regimes, setRegimes] = useState<TaxRegime[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nit: '',
    nombre: '',
    regimenTributario: '',
    retencionesBienes: [] as string[],
    retencionesServicios: [] as string[],
    activo: true
  });

  // Regímenes tributarios colombianos
  const initialRegimes: TaxRegime[] = [
    {
      id: '1',
      codigo: 'DECLARANTE',
      nombre: 'Declarante de Renta',
      esDeclarante: true,
      aplicaIVA: true,
      activo: true
    },
    {
      id: '2',
      codigo: 'NO_DECLARANTE',
      nombre: 'No Declarante de Renta',
      esDeclarante: false,
      aplicaIVA: false,
      activo: true
    },
    {
      id: '3',
      codigo: 'GRAN_CONTRIBUYENTE',
      nombre: 'Gran Contribuyente',
      esDeclarante: true,
      aplicaIVA: true,
      activo: true
    },
    {
      id: '4',
      codigo: 'PERSONA_JURIDICA',
      nombre: 'Persona Jurídica',
      esDeclarante: true,
      aplicaIVA: true,
      activo: true
    },
    {
      id: '5',
      codigo: 'PERSONA_NATURAL',
      nombre: 'Persona Natural',
      esDeclarante: false,
      aplicaIVA: false,
      activo: true
    }
  ];

  useEffect(() => {
    // Cargar datos desde localStorage
    const savedSuppliers = localStorage.getItem('suppliers');
    if (savedSuppliers) {
      setSuppliers(JSON.parse(savedSuppliers));
    }

    const savedConcepts = localStorage.getItem('retentionConcepts');
    if (savedConcepts) {
      setConcepts(JSON.parse(savedConcepts));
    }

    const savedRegimes = localStorage.getItem('taxRegimes');
    if (savedRegimes) {
      setRegimes(JSON.parse(savedRegimes));
    } else {
      setRegimes(initialRegimes);
      localStorage.setItem('taxRegimes', JSON.stringify(initialRegimes));
    }
  }, []);

  const handleSave = () => {
    if (editingSupplier) {
      // Editar proveedor existente
      const updatedSuppliers = suppliers.map(supplier =>
        supplier.id === editingSupplier.id
          ? { ...supplier, ...formData }
          : supplier
      );
      setSuppliers(updatedSuppliers);
      localStorage.setItem('suppliers', JSON.stringify(updatedSuppliers));
    } else {
      // Crear nuevo proveedor
      const newSupplier: Supplier = {
        id: `supplier-${Date.now()}`,
        ...formData
      };
      const updatedSuppliers = [...suppliers, newSupplier];
      setSuppliers(updatedSuppliers);
      localStorage.setItem('suppliers', JSON.stringify(updatedSuppliers));
    }

    setIsDialogOpen(false);
    setEditingSupplier(null);
    resetForm();
    onSuppliersUpdated?.();
  };

  const resetForm = () => {
    setFormData({
      nit: '',
      nombre: '',
      regimenTributario: '',
      retencionesBienes: [],
      retencionesServicios: [],
      activo: true
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      nit: supplier.nit,
      nombre: supplier.nombre,
      regimenTributario: supplier.regimenTributario,
      retencionesBienes: supplier.retencionesBienes,
      retencionesServicios: supplier.retencionesServicios,
      activo: supplier.activo
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingSupplier(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleRetentionChange = (conceptId: string, type: 'bienes' | 'servicios', checked: boolean) => {
    if (type === 'bienes') {
      setFormData(prev => ({
        ...prev,
        retencionesBienes: checked
          ? [...prev.retencionesBienes, conceptId]
          : prev.retencionesBienes.filter(id => id !== conceptId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        retencionesServicios: checked
          ? [...prev.retencionesServicios, conceptId]
          : prev.retencionesServicios.filter(id => id !== conceptId)
      }));
    }
  };

  const getRegimeName = (regimeId: string) => {
    const regime = regimes.find(r => r.id === regimeId);
    return regime ? regime.nombre : 'No definido';
  };

  const getConceptName = (conceptId: string) => {
    const concept = concepts.find(c => c.id === conceptId);
    return concept ? `${concept.codigo} - ${concept.nombre}` : 'Concepto no encontrado';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Configuración de Proveedores - Retenciones
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proveedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* Información básica */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>NIT</Label>
                    <Input
                      value={formData.nit}
                      onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                      placeholder="900123456-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Régimen Tributario</Label>
                    <Select value={formData.regimenTributario} onValueChange={(value) => setFormData({ ...formData, regimenTributario: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar régimen" />
                      </SelectTrigger>
                      <SelectContent>
                        {regimes.map(regime => (
                          <SelectItem key={regime.id} value={regime.id}>
                            {regime.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nombre/Razón Social</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del proveedor"
                  />
                </div>

                {/* Configuración de retenciones para bienes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <Label className="text-base font-semibold">Retenciones para Compra de Bienes</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-3">
                    {concepts.filter(c => c.activo).map(concept => (
                      <div key={concept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`bienes-${concept.id}`}
                          checked={formData.retencionesBienes.includes(concept.id)}
                          onCheckedChange={(checked) => handleRetentionChange(concept.id, 'bienes', checked as boolean)}
                        />
                        <Label htmlFor={`bienes-${concept.id}`} className="text-sm">
                          {concept.codigo} - {concept.nombre} ({concept.tasaImpuesto}%)
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configuración de retenciones para servicios */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    <Label className="text-base font-semibold">Retenciones para Adquisición de Servicios</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-3">
                    {concepts.filter(c => c.activo).map(concept => (
                      <div key={concept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`servicios-${concept.id}`}
                          checked={formData.retencionesServicios.includes(concept.id)}
                          onCheckedChange={(checked) => handleRetentionChange(concept.id, 'servicios', checked as boolean)}
                        />
                        <Label htmlFor={`servicios-${concept.id}`} className="text-sm">
                          {concept.codigo} - {concept.nombre} ({concept.tasaImpuesto}%)
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingSupplier ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NIT</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Régimen</TableHead>
              <TableHead>Ret. Bienes</TableHead>
              <TableHead>Ret. Servicios</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-mono">{supplier.nit}</TableCell>
                <TableCell>{supplier.nombre}</TableCell>
                <TableCell>{getRegimeName(supplier.regimenTributario)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {supplier.retencionesBienes.length} conceptos
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {supplier.retencionesServicios.length} conceptos
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    supplier.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {supplier.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {suppliers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay proveedores configurados</p>
            <p className="text-sm">Haga clic en "Nuevo Proveedor" para comenzar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierRetentionConfig;