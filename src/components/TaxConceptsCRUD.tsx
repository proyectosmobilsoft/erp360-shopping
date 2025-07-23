import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Settings, Calculator } from 'lucide-react';
import { TaxConcept } from '@/types/tax-configuration';

interface TaxConceptsCRUDProps {
  onConceptsUpdated?: () => void;
}

const TaxConceptsCRUD: React.FC<TaxConceptsCRUDProps> = ({ onConceptsUpdated }) => {
  const [concepts, setConcepts] = useState<TaxConcept[]>([]);
  const [editingConcept, setEditingConcept] = useState<TaxConcept | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipoImpuesto: 'RETEFUENTE' as const,
    tarifa: 0,
    baseMinima: 0,
    cuentaContableCredito: '',
    activo: true
  });

  // Conceptos tributarios DIAN 2025 iniciales
  const initialConcepts: Omit<TaxConcept, 'id' | 'fechaCreacion' | 'fechaActualizacion'>[] = [
    {
      codigo: '001',
      nombre: 'Compras generales (declarantes renta)',
      tipoImpuesto: 'RETEFUENTE',
      tarifa: 2.5,
      baseMinima: 497990,
      cuentaContableCredito: '236505001',
      activo: true
    },
    {
      codigo: '002',
      nombre: 'Compras generales (no declarantes renta)',
      tipoImpuesto: 'RETEFUENTE',
      tarifa: 3.5,  
      baseMinima: 497990,
      cuentaContableCredito: '236505002',
      activo: true
    },
    {
      codigo: '003',
      nombre: 'Servicios generales (declarantes renta)',
      tipoImpuesto: 'RETEFUENTE',
      tarifa: 4.0,
      baseMinima: 99598,
      cuentaContableCredito: '236505003',
      activo: true
    },
    {
      codigo: '004',
      nombre: 'Servicios generales (no declarantes renta)',
      tipoImpuesto: 'RETEFUENTE',
      tarifa: 6.0,
      baseMinima: 99598,
      cuentaContableCredito: '236505004',
      activo: true
    },
    {
      codigo: '101',
      nombre: 'Retención ICA Bogotá',
      tipoImpuesto: 'RETEICA',
      tarifa: 4.14,
      baseMinima: 99598,
      cuentaContableCredito: '236540001',
      activo: true
    },
    {
      codigo: '201',
      nombre: 'Retención IVA - Compras',
      tipoImpuesto: 'RETEIVA',
      tarifa: 15.0,
      baseMinima: 497990,
      cuentaContableCredito: '236575001',
      activo: false
    },
    {
      codigo: '202',
      nombre: 'Retención IVA - Servicios',
      tipoImpuesto: 'RETEIVA',
      tarifa: 15.0,
      baseMinima: 99598,
      cuentaContableCredito: '236575002',
      activo: false
    }
  ];

  useEffect(() => {
    const savedConcepts = localStorage.getItem('taxConcepts');
    if (savedConcepts) {
      setConcepts(JSON.parse(savedConcepts));
    } else {
      const conceptsWithIds = initialConcepts.map((concept, index) => ({
        ...concept,
        id: `tax-${index + 1}`,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      }));
      setConcepts(conceptsWithIds);
      localStorage.setItem('taxConcepts', JSON.stringify(conceptsWithIds));
    }
  }, []);

  const handleSave = () => {
    const now = new Date();
    
    if (editingConcept) {
      const updatedConcepts = concepts.map(concept =>
        concept.id === editingConcept.id
          ? { ...concept, ...formData, fechaActualizacion: now }
          : concept
      );
      setConcepts(updatedConcepts);
      localStorage.setItem('taxConcepts', JSON.stringify(updatedConcepts));
    } else {
      const newConcept: TaxConcept = {
        id: `tax-${Date.now()}`,
        ...formData,
        fechaCreacion: now,
        fechaActualizacion: now
      };
      const updatedConcepts = [...concepts, newConcept];
      setConcepts(updatedConcepts);
      localStorage.setItem('taxConcepts', JSON.stringify(updatedConcepts));
    }

    resetForm();
    setIsDialogOpen(false);
    onConceptsUpdated?.();
  };

  const handleEdit = (concept: TaxConcept) => {
    setEditingConcept(concept);
    setFormData({
      codigo: concept.codigo,
      nombre: concept.nombre,
      tipoImpuesto: concept.tipoImpuesto,
      tarifa: concept.tarifa,
      baseMinima: concept.baseMinima,
      cuentaContableCredito: concept.cuentaContableCredito,
      activo: concept.activo
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (conceptId: string) => {
    if (confirm('¿Está seguro de eliminar este concepto tributario?')) {
      const updatedConcepts = concepts.filter(concept => concept.id !== conceptId);
      setConcepts(updatedConcepts);
      localStorage.setItem('taxConcepts', JSON.stringify(updatedConcepts));
      onConceptsUpdated?.();
    }
  };

  const handleNew = () => {
    setEditingConcept(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      tipoImpuesto: 'RETEFUENTE',
      tarifa: 0,
      baseMinima: 0,
      cuentaContableDebito: '',
      cuentaContableCredito: '',
      activo: true
    });
  };

  const filteredConcepts = concepts.filter(concept => {
    const matchesSearch = concept.nombre.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         concept.codigo.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === 'ALL' || concept.tipoImpuesto === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RETEFUENTE': return 'bg-blue-100 text-blue-800';
      case 'RETEICA': return 'bg-green-100 text-green-800';
      case 'RETEIVA': return 'bg-purple-100 text-purple-800';
      case 'RETECREE': return 'bg-orange-100 text-orange-800';
      case 'IVA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Gestión de Conceptos Tributarios
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Concepto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {editingConcept ? 'Editar Concepto Tributario' : 'Nuevo Concepto Tributario'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="001"
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Impuesto</Label>
                    <Select value={formData.tipoImpuesto} onValueChange={(value: 'RETEFUENTE' | 'RETEICA' | 'RETEIVA' | 'RETECREE' | 'IVA') => setFormData({ ...formData, tipoImpuesto: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RETEFUENTE">Retención en la Fuente</SelectItem>
                        <SelectItem value="RETEICA">Retención ICA</SelectItem>
                        <SelectItem value="RETEIVA">Retención IVA</SelectItem>
                        <SelectItem value="RETECREE">Retención CREE</SelectItem>
                        <SelectItem value="IVA">IVA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tarifa (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tarifa}
                      onChange={(e) => setFormData({ ...formData, tarifa: parseFloat(e.target.value) || 0 })}
                      placeholder="2.50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nombre del Concepto</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                    <Label>Cuenta Contable Crédito</Label>
                    <Input
                      value={formData.cuentaContableCredito}
                      onChange={(e) => setFormData({ ...formData, cuentaContableCredito: e.target.value })}
                      placeholder="236505001"
                    />
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
        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por código o nombre..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                <SelectItem value="RETEFUENTE">Retención Fuente</SelectItem>
                <SelectItem value="RETEICA">Retención ICA</SelectItem>
                <SelectItem value="RETEIVA">Retención IVA</SelectItem>
                <SelectItem value="RETECREE">Retención CREE</SelectItem>
                <SelectItem value="IVA">IVA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tarifa</TableHead>
              <TableHead>Base Mínima</TableHead>
              <TableHead>Cuenta Crédito</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConcepts.map((concept) => (
              <TableRow key={concept.id}>
                <TableCell className="font-mono">{concept.codigo}</TableCell>
                <TableCell>{concept.nombre}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(concept.tipoImpuesto)}`}>
                    {concept.tipoImpuesto}
                  </span>
                </TableCell>
                <TableCell>{concept.tarifa}%</TableCell>
                <TableCell>${concept.baseMinima.toLocaleString()}</TableCell>
                <TableCell className="font-mono">{concept.cuentaContableCredito}</TableCell>
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
            ))}
          </TableBody>
        </Table>

        {filteredConcepts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron conceptos tributarios</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaxConceptsCRUD;