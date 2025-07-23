import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { RetentionConcept, AccountingAccount } from '@/types/retention';

interface RetentionConceptsManagerProps {
  onConceptsUpdated?: () => void;
}

const RetentionConceptsManager: React.FC<RetentionConceptsManagerProps> = ({ onConceptsUpdated }) => {
  const [concepts, setConcepts] = useState<RetentionConcept[]>([]);
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [editingConcept, setEditingConcept] = useState<RetentionConcept | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    baseMinima: 0,
    tasaImpuesto: 0,
    cuentaContable: '',
    activo: true
  });

  // Datos iniciales de conceptos DIAN 2025
  const initialConcepts: Omit<RetentionConcept, 'id' | 'fechaCreacion' | 'fechaActualizacion'>[] = [
    {
      codigo: '001',
      nombre: 'Compras generales (declarantes renta)',
      baseMinima: 497990,
      tasaImpuesto: 2.5,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '002',
      nombre: 'Compras generales (no declarantes renta)',
      baseMinima: 497990,
      tasaImpuesto: 3.5,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '003',
      nombre: 'Servicios generales (declarantes renta)',
      baseMinima: 99598,
      tasaImpuesto: 4.0,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '004',
      nombre: 'Servicios generales (no declarantes renta)',
      baseMinima: 99598,
      tasaImpuesto: 6.0,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '005',
      nombre: 'Honorarios y comisiones (personas jurídicas)',
      baseMinima: 0,
      tasaImpuesto: 11.0,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '006',
      nombre: 'Honorarios y comisiones (no declarantes renta)',
      baseMinima: 0,
      tasaImpuesto: 10.0,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '007',
      nombre: 'Arrendamiento de bienes inmuebles',
      baseMinima: 497990,
      tasaImpuesto: 3.5,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '008',
      nombre: 'Arrendamiento de bienes muebles',
      baseMinima: 0,
      tasaImpuesto: 4.0,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '009',
      nombre: 'Transporte nacional de carga',
      baseMinima: 99598,
      tasaImpuesto: 1.0,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '010',
      nombre: 'Construcción y urbanización',
      baseMinima: 497990,
      tasaImpuesto: 2.0,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '011',
      nombre: 'Servicios de hoteles y restaurantes',
      baseMinima: 99598,
      tasaImpuesto: 3.5,
      cuentaContable: '',
      activo: true
    },
    {
      codigo: '012',
      nombre: 'Servicios de vigilancia y aseo',
      baseMinima: 99598,
      tasaImpuesto: 2.0,
      cuentaContable: '',
      activo: true
    }
  ];

  // Cuentas contables ejemplo
  const initialAccounts: AccountingAccount[] = [
    {
      id: '1',
      codigo: '236505',
      nombre: 'Retención en la Fuente - Compras',
      tipo: 'PASIVO',
      nivel: 6,
      activo: true
    },
    {
      id: '2',
      codigo: '236510',
      nombre: 'Retención en la Fuente - Servicios',
      tipo: 'PASIVO',
      nivel: 6,
      activo: true
    },
    {
      id: '3',
      codigo: '236515',
      nombre: 'Retención en la Fuente - Honorarios',
      tipo: 'PASIVO',
      nivel: 6,
      activo: true
    },
    {
      id: '4',
      codigo: '236520',
      nombre: 'Retención en la Fuente - Arrendamientos',
      tipo: 'PASIVO',
      nivel: 6,
      activo: true
    }
  ];

  useEffect(() => {
    // Simular carga de datos desde localStorage o API
    const savedConcepts = localStorage.getItem('retentionConcepts');
    if (savedConcepts) {
      setConcepts(JSON.parse(savedConcepts));
    } else {
      // Inicializar con conceptos DIAN 2025
      const conceptsWithIds = initialConcepts.map((concept, index) => ({
        ...concept,
        id: `concept-${index + 1}`,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      }));
      setConcepts(conceptsWithIds);
      localStorage.setItem('retentionConcepts', JSON.stringify(conceptsWithIds));
    }

    // Cargar cuentas contables
    const savedAccounts = localStorage.getItem('accountingAccounts');
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    } else {
      setAccounts(initialAccounts);
      localStorage.setItem('accountingAccounts', JSON.stringify(initialAccounts));
    }
  }, []);

  const handleSave = () => {
    const now = new Date();
    
    if (editingConcept) {
      // Editar concepto existente
      const updatedConcepts = concepts.map(concept =>
        concept.id === editingConcept.id
          ? { ...concept, ...formData, fechaActualizacion: now }
          : concept
      );
      setConcepts(updatedConcepts);
      localStorage.setItem('retentionConcepts', JSON.stringify(updatedConcepts));
    } else {
      // Crear nuevo concepto
      const newConcept: RetentionConcept = {
        id: `concept-${Date.now()}`,
        ...formData,
        fechaCreacion: now,
        fechaActualizacion: now
      };
      const updatedConcepts = [...concepts, newConcept];
      setConcepts(updatedConcepts);
      localStorage.setItem('retentionConcepts', JSON.stringify(updatedConcepts));
    }

    setIsDialogOpen(false);
    setEditingConcept(null);
    setFormData({
      codigo: '',
      nombre: '',
      baseMinima: 0,
      tasaImpuesto: 0,
      cuentaContable: '',
      activo: true
    });

    onConceptsUpdated?.();
  };

  const handleEdit = (concept: RetentionConcept) => {
    setEditingConcept(concept);
    setFormData({
      codigo: concept.codigo,
      nombre: concept.nombre,
      baseMinima: concept.baseMinima,
      tasaImpuesto: concept.tasaImpuesto,
      cuentaContable: concept.cuentaContable,
      activo: concept.activo
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (conceptId: string) => {
    if (confirm('¿Está seguro de eliminar este concepto de retención?')) {
      const updatedConcepts = concepts.filter(concept => concept.id !== conceptId);
      setConcepts(updatedConcepts);
      localStorage.setItem('retentionConcepts', JSON.stringify(updatedConcepts));
      onConceptsUpdated?.();
    }
  };

  const handleNew = () => {
    setEditingConcept(null);
    setFormData({
      codigo: '',
      nombre: '',
      baseMinima: 0,
      tasaImpuesto: 0,
      cuentaContable: '',
      activo: true
    });
    setIsDialogOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Conceptos de Retención
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Concepto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingConcept ? 'Editar Concepto' : 'Nuevo Concepto de Retención'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código (3 caracteres)</Label>
                    <Input
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.slice(0, 3) })}
                      maxLength={3}
                      placeholder="001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tasa de Impuesto (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tasaImpuesto}
                      onChange={(e) => setFormData({ ...formData, tasaImpuesto: parseFloat(e.target.value) || 0 })}
                      placeholder="2.5"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Nombre del Concepto</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value.slice(0, 100) })}
                    maxLength={100}
                    placeholder="Compras generales..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Mínima ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.baseMinima}
                      onChange={(e) => setFormData({ ...formData, baseMinima: parseFloat(e.target.value) || 0 })}
                      placeholder="497990"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cuenta Contable</Label>
                    <Select value={formData.cuentaContable} onValueChange={(value) => setFormData({ ...formData, cuentaContable: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.codigo} - {account.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <Label>Activo</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingConcept ? 'Actualizar' : 'Crear'}
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
              <TableHead>Código</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Base Mínima</TableHead>
              <TableHead>Tasa (%)</TableHead>
              <TableHead>Cuenta Contable</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {concepts.map((concept) => {
              const account = accounts.find(acc => acc.id === concept.cuentaContable);
              return (
                <TableRow key={concept.id}>
                  <TableCell className="font-mono">{concept.codigo}</TableCell>
                  <TableCell>{concept.nombre}</TableCell>
                  <TableCell>${concept.baseMinima.toLocaleString()}</TableCell>
                  <TableCell>{concept.tasaImpuesto}%</TableCell>
                  <TableCell>{account ? `${account.codigo} - ${account.nombre}` : 'No asignada'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      concept.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {concept.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(concept)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(concept.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RetentionConceptsManager;