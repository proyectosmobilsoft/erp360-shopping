import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Calculator, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MatrizRetencion {
  id: string;
  concepto: string;
  descripcion: string;
  tipoRetencion: 'RETEFUENTE' | 'RETEIVA' | 'RETEICA';
  tipoPersonaProveedor: 'NATURAL' | 'JURIDICA' | 'AMBOS';
  declaranteRenta: boolean | null; // true=declarante, false=no declarante, null=ambos
  tipoTransaccion: 'BIENES' | 'SERVICIOS' | 'AMBOS';
  baseMinima: number; // En UVT
  porcentajeRetencion: number;
  cuentaContable: string;
  activo: boolean;
  fechaCreacion: Date;
}

const UVT_2025 = 49799;

// Conceptos precargados según DIAN 2025
const conceptosPrecargados: Omit<MatrizRetencion, 'id' | 'fechaCreacion'>[] = [
  {
    concepto: 'COMPRAS_GENERALES',
    descripcion: 'Compras generales (bienes)',
    tipoRetencion: 'RETEFUENTE',
    tipoPersonaProveedor: 'AMBOS',
    declaranteRenta: true,
    tipoTransaccion: 'BIENES',
    baseMinima: 27, // 27 UVT
    porcentajeRetencion: 2.5,
    cuentaContable: '236505001',
    activo: true
  },
  {
    concepto: 'COMPRAS_NO_DECLARANTES',
    descripcion: 'Compras generales - No declarantes',
    tipoRetencion: 'RETEFUENTE',
    tipoPersonaProveedor: 'AMBOS',
    declaranteRenta: false,
    tipoTransaccion: 'BIENES',
    baseMinima: 27,
    porcentajeRetencion: 3.5,
    cuentaContable: '236505001',
    activo: true
  },
  {
    concepto: 'SERVICIOS_GENERALES',
    descripcion: 'Servicios generales',
    tipoRetencion: 'RETEFUENTE',
    tipoPersonaProveedor: 'AMBOS',
    declaranteRenta: true,
    tipoTransaccion: 'SERVICIOS',
    baseMinima: 4, // 4 UVT
    porcentajeRetencion: 4.0,
    cuentaContable: '236505002',
    activo: true
  },
  {
    concepto: 'SERVICIOS_NO_DECLARANTES',
    descripcion: 'Servicios generales - No declarantes',
    tipoRetencion: 'RETEFUENTE',
    tipoPersonaProveedor: 'AMBOS',
    declaranteRenta: false,
    tipoTransaccion: 'SERVICIOS',
    baseMinima: 4,
    porcentajeRetencion: 6.0,
    cuentaContable: '236505002',
    activo: true
  },
  {
    concepto: 'HONORARIOS_JURIDICA',
    descripcion: 'Honorarios y comisiones - Persona jurídica',
    tipoRetencion: 'RETEFUENTE',
    tipoPersonaProveedor: 'JURIDICA',
    declaranteRenta: null,
    tipoTransaccion: 'SERVICIOS',
    baseMinima: 4,
    porcentajeRetencion: 10.0,
    cuentaContable: '236505003',
    activo: true
  },
  {
    concepto: 'HONORARIOS_NATURAL',
    descripcion: 'Honorarios y comisiones - Persona natural',
    tipoRetencion: 'RETEFUENTE',
    tipoPersonaProveedor: 'NATURAL',
    declaranteRenta: null,
    tipoTransaccion: 'SERVICIOS',
    baseMinima: 4,
    porcentajeRetencion: 11.0,
    cuentaContable: '236505003',
    activo: true
  },
  {
    concepto: 'ARRENDAMIENTOS',
    descripcion: 'Arrendamientos',
    tipoRetencion: 'RETEFUENTE',
    tipoPersonaProveedor: 'AMBOS',
    declaranteRenta: null,
    tipoTransaccion: 'SERVICIOS',
    baseMinima: 4,
    porcentajeRetencion: 3.5,
    cuentaContable: '236505004',
    activo: true
  },
  {
    concepto: 'TRANSPORTE_CARGA',
    descripcion: 'Transporte de carga nacional',
    tipoRetencion: 'RETEFUENTE',
    tipoPersonaProveedor: 'AMBOS',
    declaranteRenta: null,
    tipoTransaccion: 'SERVICIOS',
    baseMinima: 4,
    porcentajeRetencion: 1.0,
    cuentaContable: '236505005',
    activo: true
  },
  {
    concepto: 'RETEIVA_SERVICIOS',
    descripcion: 'Retención IVA servicios',
    tipoRetencion: 'RETEIVA',
    tipoPersonaProveedor: 'AMBOS',
    declaranteRenta: null,
    tipoTransaccion: 'SERVICIOS',
    baseMinima: 4,
    porcentajeRetencion: 15.0,
    cuentaContable: '236540001',
    activo: true
  },
  {
    concepto: 'RETEICA_LOCAL',
    descripcion: 'Retención ICA local',
    tipoRetencion: 'RETEICA',
    tipoPersonaProveedor: 'AMBOS',
    declaranteRenta: null,
    tipoTransaccion: 'AMBOS',
    baseMinima: 4,
    porcentajeRetencion: 0.414, // Promedio ICA Colombia
    cuentaContable: '236545001',
    activo: true
  }
];

const MatrizRetencionCRUD: React.FC = () => {
  const { toast } = useToast();
  const [conceptos, setConceptos] = useState<MatrizRetencion[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConcepto, setEditingConcepto] = useState<MatrizRetencion | null>(null);
  const [formData, setFormData] = useState({
    concepto: '',
    descripcion: '',
    tipoRetencion: 'RETEFUENTE' as const,
    tipoPersonaProveedor: 'AMBOS' as const,
    declaranteRenta: null as boolean | null,
    tipoTransaccion: 'AMBOS' as const,
    baseMinima: 4,
    porcentajeRetencion: 0,
    cuentaContable: '',
    activo: true
  });

  // Cargar conceptos precargados al inicio
  useEffect(() => {
    const conceptosConId = conceptosPrecargados.map((concepto, index) => ({
      ...concepto,
      id: `pre-${index + 1}`,
      fechaCreacion: new Date()
    }));
    setConceptos(conceptosConId);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.concepto || !formData.descripcion || !formData.cuentaContable) {
      toast({
        title: "Campos obligatorios",
        description: "Concepto, descripción y cuenta contable son obligatorios",
        variant: "destructive"
      });
      return;
    }

    const newConcepto: MatrizRetencion = {
      ...formData,
      id: editingConcepto ? editingConcepto.id : `custom-${Date.now()}`,
      fechaCreacion: editingConcepto ? editingConcepto.fechaCreacion : new Date()
    };

    if (editingConcepto) {
      setConceptos(prev => prev.map(item => item.id === editingConcepto.id ? newConcepto : item));
      toast({
        title: "Concepto actualizado",
        description: "El concepto de retención se actualizó correctamente",
      });
    } else {
      setConceptos(prev => [...prev, newConcepto]);
      toast({
        title: "Concepto creado",
        description: "El nuevo concepto de retención se creó correctamente",
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (concepto: MatrizRetencion) => {
    setEditingConcepto(concepto);
    setFormData({
      concepto: concepto.concepto,
      descripcion: concepto.descripcion,
      tipoRetencion: concepto.tipoRetencion,
      tipoPersonaProveedor: concepto.tipoPersonaProveedor,
      declaranteRenta: concepto.declaranteRenta,
      tipoTransaccion: concepto.tipoTransaccion,
      baseMinima: concepto.baseMinima,
      porcentajeRetencion: concepto.porcentajeRetencion,
      cuentaContable: concepto.cuentaContable,
      activo: concepto.activo
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (id.startsWith('pre-')) {
      toast({
        title: "No se puede eliminar",
        description: "Los conceptos precargados no se pueden eliminar",
        variant: "destructive"
      });
      return;
    }

    if (window.confirm('¿Está seguro de que desea eliminar este concepto?')) {
      setConceptos(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Concepto eliminado",
        description: "El concepto de retención se eliminó correctamente",
      });
    }
  };

  const resetForm = () => {
    setEditingConcepto(null);
    setFormData({
      concepto: '',
      descripcion: '',
      tipoRetencion: 'RETEFUENTE',
      tipoPersonaProveedor: 'AMBOS',
      declaranteRenta: null,
      tipoTransaccion: 'AMBOS',
      baseMinima: 4,
      porcentajeRetencion: 0,
      cuentaContable: '',
      activo: true
    });
  };

  const calcularBaseEnPesos = (baseUVT: number) => {
    return (baseUVT * UVT_2025).toLocaleString('es-CO');
  };

  return (
    <div className="space-y-6">
      {/* Header con información UVT */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Calculator className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-blue-900">Matriz de Retenciones DIAN 2025</h2>
              <p className="text-blue-700">
                <strong>UVT 2025:</strong> ${UVT_2025.toLocaleString('es-CO')} - 
                Conceptos configurados según normativa oficial colombiana
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón agregar */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Conceptos de Retención</h3>
          <p className="text-gray-600">Gestiona los conceptos de retención según régimen tributario</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Concepto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConcepto ? 'Editar Concepto' : 'Nuevo Concepto de Retención'}
              </DialogTitle>
              <DialogDescription>
                Configura los parámetros del concepto de retención
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Concepto (Código) *</Label>
                    <Input
                      value={formData.concepto}
                      onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                      placeholder="COMPRAS_GENERALES"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Retención *</Label>
                    <Select value={formData.tipoRetencion} onValueChange={(value: 'RETEFUENTE' | 'RETEIVA' | 'RETEICA') => setFormData({ ...formData, tipoRetencion: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RETEFUENTE">Retención en la Fuente</SelectItem>
                        <SelectItem value="RETEIVA">Retención de IVA</SelectItem>
                        <SelectItem value="RETEICA">Retención de ICA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Input
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del concepto"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Persona</Label>
                    <Select value={formData.tipoPersonaProveedor} onValueChange={(value: 'NATURAL' | 'JURIDICA' | 'AMBOS') => setFormData({ ...formData, tipoPersonaProveedor: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NATURAL">Persona Natural</SelectItem>
                        <SelectItem value="JURIDICA">Persona Jurídica</SelectItem>
                        <SelectItem value="AMBOS">Ambas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Declarante de Renta</Label>
                    <Select value={formData.declaranteRenta === null ? 'AMBOS' : formData.declaranteRenta ? 'SI' : 'NO'} 
                            onValueChange={(value) => setFormData({ ...formData, declaranteRenta: value === 'AMBOS' ? null : value === 'SI' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SI">Sí, Declarante</SelectItem>
                        <SelectItem value="NO">No Declarante</SelectItem>
                        <SelectItem value="AMBOS">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Transacción</Label>
                    <Select value={formData.tipoTransaccion} onValueChange={(value: 'BIENES' | 'SERVICIOS' | 'AMBOS') => setFormData({ ...formData, tipoTransaccion: value })}>
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Base Mínima (UVT)</Label>
                    <Input
                      type="number"
                      value={formData.baseMinima}
                      onChange={(e) => setFormData({ ...formData, baseMinima: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500">
                      ${calcularBaseEnPesos(formData.baseMinima)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>% Retención</Label>
                    <Input
                      type="number"
                      value={formData.porcentajeRetencion}
                      onChange={(e) => setFormData({ ...formData, porcentajeRetencion: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Cuenta Contable *</Label>
                    <Input
                      value={formData.cuentaContable}
                      onChange={(e) => setFormData({ ...formData, cuentaContable: e.target.value })}
                      placeholder="236505001"
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingConcepto ? 'Actualizar' : 'Crear'} Concepto
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de conceptos */}
      <Card>
        <CardHeader>
          <CardTitle>Conceptos Configurados</CardTitle>
          <CardDescription>
            {conceptos.length} conceptos de retención configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Aplicabilidad</TableHead>
                <TableHead>Base (UVT)</TableHead>
                <TableHead>% Retención</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conceptos.map((concepto) => (
                <TableRow key={concepto.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{concepto.concepto}</p>
                      <p className="text-xs text-gray-500">{concepto.descripcion}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      concepto.tipoRetencion === 'RETEFUENTE' ? 'default' :
                      concepto.tipoRetencion === 'RETEIVA' ? 'secondary' : 'outline'
                    }>
                      {concepto.tipoRetencion}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        {concepto.tipoPersonaProveedor}
                      </span>
                      <br />
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {concepto.declaranteRenta === null ? 'Ambos' : concepto.declaranteRenta ? 'Declarante' : 'No Declarante'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{concepto.baseMinima} UVT</p>
                      <p className="text-xs text-gray-500">${calcularBaseEnPesos(concepto.baseMinima)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {concepto.porcentajeRetencion}%
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {concepto.cuentaContable}
                  </TableCell>
                  <TableCell>
                    <Badge variant={concepto.activo ? 'default' : 'secondary'}>
                      {concepto.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(concepto)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(concepto.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={concepto.id.startsWith('pre-')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {conceptos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay conceptos de retención configurados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MatrizRetencionCRUD;